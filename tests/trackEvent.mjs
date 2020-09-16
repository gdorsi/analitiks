import test from "ava";
import sinon from "sinon";

let analitiks;
let uid = 0;

test.beforeEach(async () => {
  analitiks = await import("../index.mjs?id" + uid++);
  global.fetch = sinon.fake.resolves();
});

test("trackEvent works only after the setup", (t) => {
  analitiks.trackEvent("category", "action");
  t.assert(fetch.notCalled, "it does nothing before the setup");
  analitiks.setup("accountid");
  analitiks.trackEvent("category", "action");
  t.assert(fetch.called, "it sends the requests after the setup");
});

test("trackEvent sends a request to https://www.google-analytics.com correctly", (t) => {
  analitiks.setup("accountid");
  analitiks.trackEvent("category", "action", "label", 42);

  const url = new URL(fetch.lastCall.firstArg);

  t.deepEqual(url.origin, "https://www.google-analytics.com");
  t.deepEqual(url.pathname, "/collect");
  t.deepEqual(
    url.searchParams.get("tid"),
    "accountid",
    "it sends the account id"
  );
  t.deepEqual(url.searchParams.get("t"), "event", "the hit type is 'event'");
  t.deepEqual(
    url.searchParams.get("ec"),
    "category",
    "sends the event category"
  );
  t.deepEqual(url.searchParams.get("ea"), "action", "sends the event action");
  t.deepEqual(url.searchParams.get("el"), "label", "sends the event label");
  t.deepEqual(url.searchParams.get("ev"), "42", "sends the event value");
  t.truthy(
    url.searchParams.get("cid"),
    "sends some randomly generated user id"
  );
  t.deepEqual(
    fetch.lastCall.lastArg,
    {
      credentials: "include",
    },
    "it sends the cookies by default"
  );
});

test("trackEvent preserves the same user id between calls", (t) => {
  analitiks.setup("accountid");
  analitiks.trackEvent("category", "action", "label", 42);
  analitiks.trackEvent("category", "action");

  const url1 = new URL(fetch.firstCall.firstArg);
  const url2 = new URL(fetch.lastCall.firstArg);

  t.deepEqual(url1.searchParams.get("cid"), url2.searchParams.get("cid"));
  t.assert(url1.toString() !==  url2.toString())
});
