# Learning MCP by fixing it

> Nine pull requests to RubyLLM's MCP client, and what each bug taught me about the Model Context Protocol: sessions, stdio processes, OAuth races and outage backoff.

By Andy Wang · 9 Nov 2026 · https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm

Written with AI from my own pull requests, checked against GitHub. See "How this post was made" at the end.

This is the Markdown copy of the post, for AI tools and agents. The web page has the diagrams and charts; here each one is described in words.

---

You can learn a protocol by reading its specification. I learned the [Model Context Protocol](https://modelcontextprotocol.io/) a different way: by finding the places where a real client got it slightly wrong, and fixing them.

The client is the MCP support in [RubyLLM](https://rubyllm.com/), the Ruby library for talking to language models. In early November 2026 I opened nine pull requests against it. The maintainer merged all nine between 3 and 9 November. None of them adds a feature. Each one closes a gap between what MCP promises and what happens when a Rails app runs it in production, with many users, many threads and processes that crash.

**In short:** Nine small fixes to RubyLLM's MCP client, all of them merged. Each bug sits where shared state meets production: many users, many threads, processes that crash. Below are the diagrams and the lesson from each.

- 9 pull requests to the MCP client
- 9/9 merged by the maintainer, 3–9 Nov 2026
- 4 parts of the client: sessions, stdio, OAuth, outages
- 130 lines of library code changed, against 534 of tests and docs

This post walks through them in the order you meet the parts of MCP: what a client does, how it connects, how it authorizes, and what it does when a server is down. For each bug: what MCP expects, what went wrong, the fix, and why it matters. If you only have a minute, this image is the whole post:

![Summary of the post. Sessions, #1401: two requests saw the same session end and both opened a new one; the fix opens a new session only if the ended one is still current. Lesson: compare identity, not presence. stdio, #1402 to #1404: a restarted process kept the first token; the fix reads env each time the process starts. Lesson: read values when the thing that uses them starts. OAuth, #1425, #1426, #1432 and #1578: a refresh could write credentials back after a disconnect; every write now takes the same per-key lock and re-reads inside it. Lesson: a lock is about order. Outages, #1577: one tenant's broken proxy hid tools from every tenant; the backoff is now keyed on the URL plus connection settings. Lesson: key on everything that changes the outcome. 9 pull requests, all merged, 130 lines of library code, 534 lines of tests and docs.](https://www.wangyaodi.com/assets/blog/learning-mcp-by-fixing-rubyllm/summary.jpg)

*The post in one image. [Open it full size](https://www.wangyaodi.com/assets/blog/learning-mcp-by-fixing-rubyllm/summary.jpg) to save or share it.*

## MCP in one picture

MCP connects an application that uses a language model to the outside systems that model should be able to use. It has three roles:

- The **host** is your application. In my case a Rails app: it owns the users, the chats and the decisions about what each user may do.
- The **client** is the piece inside the host that speaks MCP. Here, `RubyLLM::MCP`.
- The **server** offers capabilities: **tools** the model can call (`tools/list`, `tools/call`), **resources** it can read by URI, and **prompts**, which are message templates. A server can be a remote service like Linear or GitHub, or a local program.

Every message is JSON-RPC. It travels over one of two **transports**: Streamable HTTP for a remote server, or stdio for a local one, where the client starts the server as a child process and writes JSON to its stdin. Remote servers usually need **authorization**, which in MCP means OAuth with PKCE.

**In short:** Your app (the host) uses an MCP client to reach servers that offer tools, resources and prompts, over Streamable HTTP or stdio, usually with OAuth. The fixes landed in four parts of the client:

> **Figure 1. The parts of an MCP client, and where each pull request landed.**
>
> Where the nine pull requests sit in an MCP client.
>
> A Rails host calls RubyLLM::MCP. Inside the client are three parts: the client core that discovers the protocol version and sends JSON-RPC (pull request 1401), OAuth with its credential store and per-key locks (1425, 1426, 1432, 1578), and outage backoff (1577). The client reaches servers over Streamable HTTP or stdio (1402, 1403, 1404). Servers offer tools, resources and prompts.

In RubyLLM all of this hides behind a small class. This is the shape of the Linear example in the [MCP guide](https://rubyllm.com/mcp/):

```ruby
class Linear < RubyLLM::MCP
  url "https://mcp.linear.app/mcp"
  inputs :user
  oauth owner: :user
end

linear = Linear.new(user: current_user)
chat = RubyLLM.chat.with_mcp(linear)
chat.ask("Which of my issues are blocked?")
```

Four lines describe the server. Behind them the client finds the protocol version, opens a connection, signs in as that user, refreshes their token, lists the tools and hands them to the model. Each step is a place where shared state can go wrong. That is where the bugs were.

## One client, two generations of the protocol

One detail matters for the first fix. RubyLLM speaks the **2026-07-28** revision of MCP. It starts with a `server/discover` request; a server on that revision answers with the versions it supports, and there is no session to set up. A server from an older revision (2024-11-05 to 2025-11-25) gets the old handshake instead: `initialize`, then `notifications/initialized`.

**In short:** RubyLLM speaks the 2026-07-28 revision, which has no sessions. Older servers still use the initialize handshake and a session that can end, so the client has to notice and start a new one.

Those older servers keep a **session**. Over HTTP, the server hands out an `Mcp-Session-Id` header and answers `404` once that session is gone. Over stdio, the session lives as long as the server process. When a session ends, the client must notice, run the handshake again and retry. Most MCP servers in use today are still on the older revisions, so this path runs constantly.

## Sessions: one new session per ended session (#1401)

Agents call tools in parallel. So picture two requests on the same client, both sent on session S1, both coming back with "this session has ended". Before [#1401](https://github.com/crmne/ruby_llm/pull/1401), each of them ran the handshake. The handshake sat behind a mutex, so they took turns, but nothing told the second thread that the first had already started a new session. The second handshake replaced the first one's session, and that session was never closed. It stayed open on the server.

**In short:** Two requests found the same session ended, and each started a new one, leaving one open on the server. Now a request starts a new session only if the one that ended is still the current one; otherwise it retries on the new one.

> **Figure 2. The race in #1401. The fix compares sessions; it doesn't add a lock.**
>
> Two requests find the same session ended, before and after pull request 1401.
>
> Before: requests A and B are both sent on session S1, both get a 404, and each runs a handshake, creating S2 and then S3; S2 is never closed. After: the error carries the session that ended. Request A sees S1 is still current and starts S2. Request B sees the current session is already S2 and retries on it.

The fix gives `SessionExpired` the session that ended: the HTTP session ID, or the stdio process. Both transports expose their current session with a `session` reader. A thread starts a new session only when the one that ended is still the current one; otherwise another thread already did the work, and it retries on that:

```ruby
rescue SessionExpired => e
  reconnect(e.session)
  call(method, params, headers:, &)
end

def reconnect(expired)
  @connecting.synchronize do
    @server = handshake if @server.nil? || @transport.session.equal?(expired)
  end
end
```

The handshake still runs under the same mutex, and nothing locks the request itself, so tool calls still run in parallel. The issue's script ran a legacy server on loopback: on `main` it opened three sessions and left one open; with the fix it opened two and closed the second.

> **What it taught me:** A mutex makes threads take turns. It doesn't tell the second thread that the first one already fixed the problem. For that, compare *which* thing failed with what is current now, by identity.

## stdio: a server is a process, and processes restart (#1402 · #1403 · #1404)

A stdio server is a program the client starts, such as GitHub's MCP server in a Docker container. You pass it secrets through `env`, and in RubyLLM a value can be a block or a method name, so each user gets their own token:

```ruby
env GITHUB_PERSONAL_ACCESS_TOKEN: -> { user.github_token }
```

The client starts that process again after `close` or after a crash. Before [#1402](https://github.com/crmne/ruby_llm/pull/1402), the blocks ran once, when the MCP object built its transport. Every later process got the values from the first start. If the app rotated the token in between, the new process still got the old one.

**In short:** A stdio server is a child process, and it restarts. #1402 reads `env` at each start, so a rotated token reaches the new process. #1403 makes the test fail if app secrets or proxy settings leak into it, and #1404 points the docs at GitHub's own server.

> **Figure 3. The connector lives longer than the process. Read values at the moment the process starts.**
>
> When env values are read, before and after pull request 1402.
>
> A timeline: the MCP object is built, process 1 starts, the token is rotated, the process exits, process 2 starts. Before: env is read once when the object is built, so both processes get token-v1. After: the transport keeps a block and calls it at each start, so process 2 gets token-v2.

Now the MCP object hands the transport a block, and `Stdio#start` calls it each time it starts the process:

```ruby
# lib/ruby_llm/mcp.rb: the transport gets a block, not a Hash
env: -> { settings.env.transform_values { |value| resolve(value) } },

# lib/ruby_llm/mcp/stdio.rb, in Stdio#start
env = ENV.slice(*INHERITED_ENV).merge(environment)
@stdin, @stdout, @process = Open3.popen2(env, *@command, unsetenv_others: true, **options)
```

The second line shows the other half of the stdio story. Since an earlier upstream change ([#1359](https://github.com/crmne/ruby_llm/pull/1359)), a server process inherits only a short allowlist from your app, `INHERITED_ENV` (things like `PATH`, `HOME` and `LANG`), plus what you pass in `env`. `unsetenv_others: true` drops everything else. A local MCP server is somebody else's code, and it shouldn't see your Rails secrets or proxy settings.

> **Figure 4. The stdio allowlist is a security boundary. #1403 made its test able to fail.**
>
> What a stdio server inherits from the application's environment.
>
> The parent process has PATH, HOME, LANG, HTTPS_PROXY, BUNDLE_PATH, RAILS_ENV, SECRET_KEY_BASE and NODE_EXTRA_CA_CERTS. Open3.popen2 with unsetenv_others passes only the allowlist plus the values from env. The server process gets PATH, HOME, LANG and GITHUB_PERSONAL_ACCESS_TOKEN. Pull request 1403 tests that the blocked variables never reach it.

[#1403](https://github.com/crmne/ruby_llm/pull/1403) changed no library code. The 2.2 upgrade guide says a stdio server no longer inherits a token, a proxy, `NODE_EXTRA_CA_CERTS` or `BUNDLE_PATH`, but the spec that guarded this checked only a fake API key and `BUNDLE_GEMFILE`. You could add `HTTPS_PROXY` or `RAILS_ENV` to the allowlist and every spec still passed. Now the spec plants all of them in the parent, in every upper- and lowercase proxy spelling, and fails if any reach the server. It names the variables that leaked, never their values.

[#1404](https://github.com/crmne/ruby_llm/pull/1404) is a one-line docs fix. The guide's `env` example used an npm package that npm now marks as deprecated. It now runs GitHub's own server, which also shows the boundary nicely: Docker's `-e` forwards only the variable that `env` gave the `docker` process.

```ruby
class GitHub < RubyLLM::MCP
  command "docker", "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
          "ghcr.io/github/github-mcp-server"
  env GITHUB_PERSONAL_ACCESS_TOKEN: ENV.fetch("GITHUB_TOKEN")
end
```

> **What it taught me:** An object's lifetime and a process's lifetime are different things. Read a value at the moment the thing that uses it starts. And a security boundary is only as real as the test that fails when someone widens it.

## OAuth: the lock is about order (#1425 · #1432 · #1426 · #1578 · #1616 · #1617)

Four of the nine fixes are in OAuth. That isn't an accident. A connection to a remote MCP server has state: an authorization in progress, an access token, a refresh token, an expiry. Several MCP objects for the same user can touch that state at once: a web request, a background job, a callback. Every operation reads and writes the same row in the credential store.

**In short:** Four fixes keep one user's credentials in order. Disconnect and authorize now take the same per-key lock as refresh and re-read the store inside it (#1425, #1432). The lock is freed once no thread needs it (#1426), and an old instance whose credentials were deleted gets a clean 401 instead of a crash (#1578).

> **Figure 5. OAuth states for one user and one server. Badges mark the transition each fix protects.**
>
> The OAuth states of an MCP connection, and the fixes that guard each transition.
>
> Four states: no credentials, pending, authorized and refreshing. authorization_url moves from no credentials to pending; authorize with the callback moves to authorized (guarded by 1432); a token coming due moves to refreshing and back. deauthorize from any state returns to no credentials (guarded by 1425 during a refresh, and by 1578 for an instance whose token comes due afterwards). 1426 frees the per-key lock that all of these hold.

RubyLLM already held a per-key lock while it refreshed a token, so two threads wouldn't spend the same rotating refresh token twice. The bugs were all about operations that skipped that lock, or trusted a copy of the state they had read earlier.

### Disconnect has to win (#1425)

A user clicks "disconnect Linear" while a background job is refreshing their token. `deauthorize` deleted the credentials without taking the lock. The refresh was already waiting on the token endpoint; when the answer came back it wrote the new token into the store. The user had disconnected, and the server stayed connected for every later instance.

**In short:** A user disconnected while a refresh was waiting on the token endpoint. The delete landed first, then the refresh wrote a new token back. Now deauthorize waits for the refresh, then deletes.

> **Figure 6. The race in #1425. Same work, different order: whoever deletes last decides the outcome.**
>
> A refresh and a deauthorize on the same credentials, before and after pull request 1425.
>
> Before: thread 1 reads the refresh token and waits on the token endpoint; thread 2 deletes the credentials meanwhile; thread 1 then writes access-2, so the store ends up with a token again. After: thread 2 waits for the lock thread 1 holds, and deletes after thread 1 writes, so the store ends up empty.

The fix is four lines: `deauthorize` runs inside the same `synchronize` as refresh. It waits for a refresh in flight, then deletes what that refresh wrote.

```ruby
def deauthorize
  synchronize do
    @credential = nil
    store.delete(key)
  end
end
```

The spec holds the refresh at the token endpoint with a `Queue`, deauthorizes from a second thread, then lets the refresh finish. On `main` the store ended up holding `access-2`.

### The same race, one step earlier (#1432)

Once one operation is fixed, look for its siblings. `authorize`, which finishes the OAuth callback by exchanging the code for tokens, took neither the lock nor a fresh read of the store. That allowed two bad orders. A user disconnects while the callback is mid-exchange: the delete lands first, then the exchange writes tokens back. Or an instance that cached the pending authorization completes a callback after another instance forgot it.

**In short:** The same race happened one step earlier, during the OAuth callback. Now `authorize` holds the lock and reads the store again, so a callback after a disconnect raises instead of restoring tokens.

```ruby
def authorize(params)
  synchronize do
    @credential = store.read(key)
    pending = credential&.fetch('pending', nil) or raise Error, 'No authorization in progress'
    check_callback(pending, params)
    tokens = token_request('authorization_code', code: value(params, :code),
                                                 redirect_uri: pending['redirect_uri'],
                                                 code_verifier: pending['verifier'], client: pending)
    store_tokens(tokens, client: pending.slice(*CLIENT_FIELDS, 'scope'))
  end
end
```

Two changes: hold the lock, and read the store again *inside* it. A callback after a disconnect now raises "No authorization in progress". A new authorization started after the disconnect still works, and a spec guards that too.

### A lock table needs a lifetime (#1426)

The per-key lock came from a Hash that made a new `Mutex` for every key it was asked about, and never let one go:

```ruby
@refreshes = Hash.new { |refreshes, key| refreshes[key] = Mutex.new }
```

A key is one owner on one server. In a long-running multi-tenant process that's one mutex per user, forever: about 23 MB after 100,000 keys. You can't just delete the entry when a thread leaves, either. If another thread is waiting on that mutex and a third arrives, the third would get a fresh mutex and run at the same time as the second. So each entry now counts the threads that hold *or wait for* its lock, and the last one out deletes it:

**In short:** One mutex per user was kept forever, about 23 MB after 100,000 keys. Now each entry counts the threads that hold or wait for its lock, and the last one out deletes it.

> **Figure 7. #1426. The entry lives exactly as long as some thread needs the lock.**
>
> A per-key lock that counts its users.
>
> Step 1: thread 1 takes the lock, the entry is key to lock and count 1. Step 2: thread 2 waits, count 2. Step 3: thread 1 leaves, count 1, the entry stays because thread 2 still needs the same lock. Step 4: thread 2 leaves, count 0, the entry is deleted.

```ruby
def self.refreshing(key, &)
  lock = @refreshes_lock.synchronize do
    entry = @refreshes[key] ||= [Mutex.new, 0]
    entry[1] += 1
    entry.first
  end
  begin
    lock.synchronize(&)
  ensure
    @refreshes_lock.synchronize do
      @refreshes.delete(key) if (@refreshes[key][1] -= 1).zero?
    end
  end
end
```

Same-key refreshes still share one mutex, and different keys still refresh in parallel. I chose this over lock striping (a fixed pool of mutexes) because striping makes unrelated users wait on each other's token requests. The overhead is about 0.2 µs per call, which a token request dwarfs.

### Treat "gone" as a normal state (#1578)

The last OAuth fix follows from the first. After #1425, an old instance can't write credentials back once another instance deletes them. But that old instance still holds its cached token, and when the token came due, `refresh` found no row, returned false, and `access_token` read `credential['access_token']` from `nil`. A job whose user had disconnected crashed with `NoMethodError`, an error outside `RubyLLM::Error` that your app's rescue clauses won't catch.

**In short:** A job whose user had disconnected crashed with `NoMethodError` when its cached token came due. Now it gets `RubyLLM::UnauthorizedError`, like any new instance.

```ruby
renew if expiring?
credential.to_h['access_token']  # was credential['access_token']
```

Now the request goes out without a token, and the server's 401 raises `RubyLLM::UnauthorizedError`, the same as for a new instance. No token request is sent, and the store stays empty.

Two limits apply to all four. The in-process mutex covers threads; across processes, the guarantee comes from the credential store's own `synchronize(key)`, which the Active Record store implements with a row lock. And `deauthorize` forgets the credentials locally; it doesn't revoke the token at the provider.

### Two follow-ups, after the post (#1616 · #1617)

The day after this post went out, the maintainer merged two more of my pull requests on the same lock. They aren't counted in the nine above.

**In short:** After the post, #1616 put the last credential writer that skipped the lock, `authorization_url`, under it with a fresh read, and #1617 added specs that show the lock holding across two processes.

[#1616](https://github.com/crmne/ruby_llm/pull/1616) found one more writer. `authorization_url` starts a new authorization and keeps the tokens the owner already has while it is pending. It merged the pending state into the credential the instance had *cached*, and wrote it outside the lock. So an instance that had already been through one authorization could start another after a disconnect elsewhere, and write the forgotten tokens, refresh token included, back with it:

```ruby
# session already completed one authorization
linear.new(user: 'ada').deauthorize       # the user disconnects in another request
session.authorization_url(redirect_uri:)  # the old instance starts another authorization
linear.new(user: 'ada').authorized?       # was true: the forgotten tokens were stored again
```

Now `authorization_url` reads the stored credential inside the same `synchronize` block before it writes, like every other writer. Discovery and client registration still run outside it, so the lock covers one read and one write. A refresh also no longer drops a pending authorization: only `authorize` clears it, once the code exchange succeeds.

[#1617](https://github.com/crmne/ruby_llm/pull/1617) changed no library code. Across processes, the lock is the store's `synchronize`: for the Active Record store, a transaction whose first statement updates the credential row. The one fork spec held the token endpoint with `sleep 0.2`, so it could pass without any lock if the second process started late. The new specs fork two processes, hold the first at the token endpoint on a pipe, and release it only after the second reports that SQLite made it wait. No timing is involved, and each spec fails when its lock is removed. Outside the suite, I ran the same races against PostgreSQL 17: 250 examples over 50 iterations, no failures.

> **What it taught me:** "Thread-safe" was the wrong question. The right one is about order: for one user's credentials, every operation that writes them goes through the same lock and reads the current state inside it. Then think about what's left behind: the lock entries, and the instances still holding an old copy.

## Outages: key the backoff on what actually differs (#1577)

When an MCP server can't be reached, RubyLLM doesn't stop the chat. The turn goes on without that server's tools, and the server sits out for a minute across the whole process, so a dead server doesn't hold up every request. That process-wide memory needs a key. For a server with a static URL, the key was the URL.

But each MCP object connects through its own `RubyLLM.context`, with its own proxy, TLS options, Faraday adapter and timeout. If tenant A's context goes through a proxy that is down, A's failure marked the URL as down, and tenant B, who reaches the same URL directly, lost its tools too.

**In short:** One tenant's broken proxy hid a server's tools from every tenant on the same URL. #1577 keys the backoff on the URL plus the context's proxy, TLS options, adapter and timeout.

> **Figure 8. #1577. One tenant's broken proxy should only sideline its own route.**
>
> Outage keys for two tenants on the same MCP server URL, before and after pull request 1577.
>
> Before: tenants A and B share one outage key, the URL. A fails through a broken proxy, so both get no tools. After: the key adds the context's proxy, TLS, adapter and timeout. A's key is marked down, B's key is not, and B's tools are listed.

The key now adds the four settings the HTTP transport builds its connection from:

```ruby
def key(server)
  settings = server.class
  endpoint = [settings.url, *settings.command]
  return server if settings.transport || !endpoint.compact.all?(String)

  config = server.send(:config)
  ssl = Transport::Connection.ssl_snapshot(config.ssl) if config.ssl
  [*endpoint, config.http_proxy, ssl, config.faraday_adapter, config.request_timeout]
end
```

Measured against a loopback MCP server, with tenant A's proxy down:

|  | `main` | With #1577 |
|---|---|---|
| Tenant A (proxy down), tools offered | `[]` | `[]` |
| Tenant B (direct), tools offered | `[]` | `[:echo]` |
| Tenant B, `linear.tools` | `["echo"]` | `["echo"]` |

This isolates connection routes, not users. Two users whose contexts share the same settings still share one backoff, which is what you want: a job that builds its MCP objects anew keeps skipping a route that is really dead.

> **What it taught me:** A cache or a backoff is only correct if its key holds everything that changes the outcome. "Same URL" looked like "same server", but the connection to it was different.

## The fix is the small part

Every one of these fixes is short. Most of each pull request is the test that proves the bug exists and stays fixed:

**In short:** Most of each pull request is tests: 130 lines of library code against 534 of tests and docs. Each fix started with a reproduction through the public API and a spec that fails on `main`.

> **Figure 9. Lines added plus removed in each pull request, from GitHub. About four of every five are tests.**
>
> Lines changed per pull request, library code against tests and docs.
>
> Lines added plus removed. 1401: 43 library, 187 tests. 1402: 38 library, 87 tests and docs. 1403: 9 tests. 1404: 2 docs. 1425: 6 library, 30 tests. 1426: 16 library, 72 tests. 1432: 14 library, 62 tests. 1577: 11 library, 72 tests and docs. 1578: 2 library, 13 tests. In total, 130 lines of library code and 534 of tests and docs.

| PR | Topic | Library | Tests and docs | Status |
|---|---|---|---|---|
| #1401 | Sessions | 43 | 187 | Merged |
| #1402 | stdio env | 38 | 87 | Merged |
| #1403 | Env isolation test | 0 | 9 | Merged |
| #1404 | Docs example | 0 | 2 | Merged |
| #1425 | Deauthorize lock | 6 | 30 | Merged |
| #1426 | Lock lifetime | 16 | 72 | Merged |
| #1432 | Authorize lock | 14 | 62 | Merged |
| #1577 | Outage keys | 11 | 72 | Merged |
| #1578 | Forgotten token | 2 | 13 | Merged |

That ratio is the method, and it's where most of the learning happened. Each pull request followed the same steps:

1. **Reproduce through the public API.** A short script on `main` that shows the bug the way an app would meet it: three sessions instead of two, `token-v1` twice, `authorized_after_deauthorize: true`.
2. **Write specs that fail on `main`.** For races, the threads are lined up with `Queue`s and `Thread#stop?`, never with `sleep`, so the bad order happens every run.
3. **Make every part of the fix necessary.** Revert one part, and a spec must fail. In #1426, never deleting, deleting while others wait, not counting, and a fresh lock per caller each fail a spec.
4. **Add guards for what must not change.** Different keys still refresh in parallel; a new authorization after a disconnect still works; a single request still recovers its session.
5. **Show before and after in the description.** A small table of what `main` does and what the branch does, measured, not described.

Writing the failing spec is how you learn a protocol in this kind of depth. To stop a refresh at the token endpoint, you have to know exactly when a client talks to that endpoint. To prove that one session leaks, you have to know what ends a session over HTTP and what ends one over stdio. The specification tells you the rules; a failing test makes you understand the order things happen in.

## Six patterns I took away

1. **Compare identity, not presence.** "Is there a session?" was the wrong check; "is it still the one that ended?" was the right one. (#1401)
2. **Read values when the thing that uses them starts.** Not when its wrapper is built. (#1402)
3. **A boundary needs a test that can fail.** Plant the secrets, then prove they don't cross. (#1403)
4. **One lock per resource, for every write, with a fresh read inside it.** Locks are about the order of operations on one user's state. (#1425, #1432)
5. **Everything you create per key needs a way to go away.** Locks, entries, caches. (#1426)
6. **Key shared state on everything that changes the outcome.** And treat "gone" as a normal state, not a crash. (#1577, #1578)

None of these is specific to MCP. They're the same lessons a Rails app teaches you about background jobs, caches and webhooks. MCP is a good place to learn them because a client sits between so many moving parts: your users, your threads, a child process, a remote server and an OAuth provider.

## Limits worth knowing

**In short:** All nine fixes, and the two follow-ups, shipped in RubyLLM 2.2.0. `deauthorize` forgets credentials locally and doesn't revoke the token, and cross-process safety depends on the credential store.

- All nine pull requests, and the two follow-ups, shipped in [RubyLLM 2.2.0](https://github.com/crmne/ruby_llm/releases/tag/v2.2.0) on 10 November 2026. Before that you needed `main`.
- The session fix in #1401 only applies to servers older than the 2026-07-28 revision, which has no protocol-level session.
- #1402 reads `env` at each start. It doesn't change the environment of a process that is already running.
- `deauthorize` forgets credentials in your store. It is not a token revocation at the provider.
- Cross-process safety for OAuth depends on the credential store. The Active Record store locks the row; a custom shared store has to implement `synchronize(key)` itself.
- On SQLite, a process waiting for that lock gives up after the adapter's `timeout` (5 seconds in RubyLLM's test app). In my checks for #1617, holding a refresh at the token endpoint for 7 seconds made a concurrent `deauthorize` raise `ActiveRecord::StatementTimeout`, and the refreshed credentials stayed. A slow token endpoint turns waiting into an error.
- The tool descriptions a server sends are not a permission system. Your app still decides what each user may do, and tool output can carry prompt injection.

## A reading path through the source

**In short:** Read five files in order, each next to its pull requests: `mcp.rb`, `client.rb`, `http.rb` and `stdio.rb`, `oauth.rb`, then `outages.rb`.

If you want to learn MCP the same way, read RubyLLM's MCP code in this order, with each pull request's diff and specs open next to it:

1. `lib/ruby_llm/mcp.rb`: the class DSL (`url`, `command`, `env`, `inputs`, `oauth`) and how it builds a transport.
2. `lib/ruby_llm/mcp/client.rb`: `discover`, `handshake` and `reconnect`. Start with #1401.
3. `lib/ruby_llm/mcp/http.rb` and `stdio.rb`: the two transports and their session lifetimes. Then #1402 and #1403.
4. `lib/ruby_llm/mcp/oauth.rb`: `refreshing`, `authorize`, `deauthorize` and `access_token`. Then #1425, #1426, #1432 and #1578, in that order.
5. `lib/ruby_llm/mcp/outages.rb`: which errors count as an outage, and the key. Then #1577.

Then pick one invariant, such as "after a disconnect, no credentials", and try to break it with two threads. If you can, you have your first pull request. All my merged ones are listed on my [open-source page](https://www.wangyaodi.com/oss), and RubyLLM's [MCP guide](https://rubyllm.com/mcp/) covers the parts I didn't touch: resources, prompts, input requests, progress and subscriptions.

## Read this with an AI

This post is long and structured on purpose, so you can hand it to an AI and work through it together. A plain Markdown copy, without the page around it, lives at [`/blog/learning-mcp-by-fixing-rubyllm.md`](https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm.md). Chat assistants and coding agents such as Claude Code or Codex can read it straight from that address.

**In short:** A Markdown copy of this post, made for chat assistants and coding agents, is at [`/blog/learning-mcp-by-fixing-rubyllm.md`](https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm.md). The full post has ready-made prompts.

Or start from one of these prompts. The first works in any chat. Run the other two from a coding agent inside your own repository, where it can read your code.

**Learn MCP from it**

```text
Read https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm.md and teach me the Model Context Protocol through the bugs it describes: one section at a time, in plain words, with one question for me after each section before you move on.
```

**Review your code**

```text
Read https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm.md and use its six patterns as a checklist. Review the code in this repository that keeps shared state: sessions, OAuth credentials, caches, backoffs and locks. List each place where state can be written outside its lock, read stale, never cleaned up, or keyed on too little, with the file and line.
```

**Write the failing test**

```text
Read https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm.md, then pick the riskiest race you found in this repository. Write a spec that reproduces it every time, lining the threads up with queues instead of sleeps, so it fails before the fix and passes after it. Don't change library code until I've seen the failing spec.
```

## How this post was made

I wrote this post with AI, and every post here says how it was made. The work behind it is mine: nine pull requests, with their code, specs and descriptions public on GitHub. Here is who did what:

- **Sources:** My nine pull requests to crmne/ruby_llm (diffs, specs and descriptions) and RubyLLM's MCP guide, listed under [References](#references).
- **Study notes:** A first study guide to the pull requests, made with ChatGPT.
- **Draft:** The text, diagrams, chart and images, drafted with Claude Code.
- **Checks:** Every code sample, number and pull request state checked against GitHub on 9 November 2026; the follow-ups and the 2.2.0 release on 11 November 2026.
- **Review:** Read and approved by me before publishing.
- **Updated:** 9 November 2026: #1577 and #1578 were merged after the post went out, so their status, the counts and the summary image now say so. 11 November 2026: added #1616 and #1617, two follow-ups merged on 10 November, and noted that all of them shipped in RubyLLM 2.2.0.

If you find a mistake, tell me on X and I'll fix it here.

## References

**In short:** All nine pull requests are [on GitHub](https://github.com/crmne/ruby_llm/pulls?q=is%3Apr+author%3Ayorzi), along with the upstream changes and docs they build on.

My pull requests to [crmne/ruby_llm](https://github.com/crmne/ruby_llm), in the order of this post:

1. [#1401](https://github.com/crmne/ruby_llm/pull/1401) Start one new MCP session per ended session (merged 3 Nov 2026)
2. [#1402](https://github.com/crmne/ruby_llm/pull/1402) Read stdio MCP env values each time the server starts (merged 3 Nov 2026)
3. [#1403](https://github.com/crmne/ruby_llm/pull/1403) Cover proxy and Bundler variables in stdio isolation (merged 3 Nov 2026)
4. [#1404](https://github.com/crmne/ruby_llm/pull/1404) Use GitHub's own MCP server in the stdio env example (merged 3 Nov 2026)
5. [#1425](https://github.com/crmne/ruby_llm/pull/1425) Hold the refresh lock while forgetting MCP credentials (merged 4 Nov 2026)
6. [#1426](https://github.com/crmne/ruby_llm/pull/1426) Drop a refresh lock once no thread needs it (merged 4 Nov 2026)
7. [#1432](https://github.com/crmne/ruby_llm/pull/1432) Hold the refresh lock while completing an MCP authorization (merged 5 Nov 2026)
8. [#1577](https://github.com/crmne/ruby_llm/pull/1577) Key MCP outages on the context's connection settings (merged 9 Nov 2026)
9. [#1578](https://github.com/crmne/ruby_llm/pull/1578) Send no MCP token once forgotten credentials expire (merged 9 Nov 2026)

Follow-ups merged after the post went out, and the release that shipped them all:

- [#1616](https://github.com/crmne/ruby_llm/pull/1616) Start MCP authorizations from the stored credential (merged 10 Nov 2026)
- [#1617](https://github.com/crmne/ruby_llm/pull/1617) Test MCP credential locking across processes (merged 10 Nov 2026)
- [RubyLLM 2.2.0](https://github.com/crmne/ruby_llm/releases/tag/v2.2.0) release notes (10 Nov 2026)

Upstream changes they build on, by RubyLLM's maintainer:

- [#1359](https://github.com/crmne/ruby_llm/pull/1359) Give stdio MCP servers only a safe environment
- [#1493](https://github.com/crmne/ruby_llm/pull/1493) Go on without an MCP server that can't be reached

Docs:

- [Model Context Protocol](https://modelcontextprotocol.io/): the specification
- [RubyLLM MCP guide](https://rubyllm.com/mcp/)
- [GitHub's MCP server](https://github.com/github/github-mcp-server), used in the stdio example

---

Discuss this post on X: reply to [@yorzi](https://x.com/yorzi) with a link to https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm
