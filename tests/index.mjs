import test from "ava";
import sinon from "sinon";

let analitiks;
let uid = 0;

const resetModule = async () => {
  analitiks = await import("../index.mjs?id" + uid++);
};

test.beforeEach(async () => {
  await resetModule();
  global.fetch = sinon.fake.resolves();
});

test("trackEvent works only after the setup", (t) => {
  analitiks.trackEvent("category", "action");
  t.assert(fetch.notCalled, "it does nothing before the setup");
  analitiks.setup("accountid");
  analitiks.trackEvent("category", "action");
  t.assert(fetch.called, "it sends the events after the setup");
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
  t.assert(url1.toString() !== url2.toString());
});

test("trackEvent hanldes anonymous mode correctly", (t) => {
  analitiks.setup("accountid", true);
  analitiks.trackEvent("category", "action", "label", 42);
  analitiks.trackEvent("category", "action");

  const url1 = new URL(fetch.firstCall.firstArg);
  const url2 = new URL(fetch.lastCall.firstArg);

  t.deepEqual(
    url1.searchParams.get("cid"),
    url2.searchParams.get("cid"),
    "the user is the same within the session"
  );
  t.deepEqual(
    fetch.lastCall.lastArg,
    {
      credentials: false,
    },
    "it does not send cookies"
  );
  t.deepEqual(
    url1.searchParams.get("aip"),
    "1",
    "enables the `Anonymize IP` param"
  );
});

test("trackPageView works only after the setup", (t) => {
  analitiks.trackPageView();
  t.assert(fetch.notCalled, "it does nothing before the setup");
  analitiks.setup("accountid");
  analitiks.trackPageView();
  t.assert(fetch.called, "it sends the event after the setup");
});

test("trackPageView sends a request to https://www.google-analytics.com correctly", (t) => {
  analitiks.setup("accountid");
  analitiks.trackPageView();

  const url = new URL(fetch.lastCall.firstArg);

  t.deepEqual(url.origin, "https://www.google-analytics.com");
  t.deepEqual(url.pathname, "/collect");
  t.deepEqual(
    url.searchParams.get("tid"),
    "accountid",
    "it sends the account id"
  );
  t.deepEqual(
    url.searchParams.get("t"),
    "pageview",
    "the hit type is 'pageview'"
  );
  t.deepEqual(
    url.searchParams.get("dp"),
    location.pathname,
    "sends the current page as default"
  );
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

test("trackPageView preserves the same user id between calls", (t) => {
  analitiks.setup("accountid");
  analitiks.trackPageView();
  analitiks.trackPageView("/test/page");

  const url1 = new URL(fetch.firstCall.firstArg);
  const url2 = new URL(fetch.lastCall.firstArg);

  t.deepEqual(url1.searchParams.get("cid"), url2.searchParams.get("cid"));
  t.assert(url1.toString() !== url2.toString());
});

test("trackPageView could send a custom pathname", (t) => {
  analitiks.setup("accountid");
  analitiks.trackPageView("/test/page");

  const url1 = new URL(fetch.firstCall.firstArg);

  t.deepEqual(url1.searchParams.get("dp"), "/test/page");
});

test("trackPageView hanldes anonymous mode correctly", (t) => {
  analitiks.setup("accountid", true);
  analitiks.trackPageView();
  analitiks.trackPageView("/test/page");

  const url1 = new URL(fetch.firstCall.firstArg);
  const url2 = new URL(fetch.lastCall.firstArg);

  t.deepEqual(
    url1.searchParams.get("cid"),
    url2.searchParams.get("cid"),
    "the user is the same within the session"
  );
  t.deepEqual(
    fetch.lastCall.lastArg,
    {
      credentials: false,
    },
    "it does not send cookies"
  );
  t.deepEqual(
    url1.searchParams.get("aip"),
    "1",
    "enables the `Anonymize IP` param"
  );
});

test("anonymous mode could be disabled", (t) => {
  analitiks.setup("accountid", true);

  analitiks.trackPageView();

  analitiks.setup("accountid", false);

  analitiks.trackPageView("/test/page");

  const urlAnonymous = new URL(fetch.firstCall.firstArg);
  const urlNotAnonymous = new URL(fetch.lastCall.firstArg);

  t.notDeepEqual(
    urlAnonymous.searchParams.get("cid"),
    urlNotAnonymous.searchParams.get("cid"),
    "the user id is regenerated"
  );
  t.deepEqual(
    fetch.lastCall.lastArg,
    {
      credentials: "include",
    },
    "it sends the cookies when anonymous mode is disabled"
  );
  t.deepEqual(
    urlNotAnonymous.searchParams.get("aip"),
    null,
    "the `Anonymize IP` param is no more enabled"
  );
});

test("the uid is preserved across subsequent navigations", async (t) => {
  analitiks.setup("accountid");
  console.log(localStorage.getItem("#ak"))

  analitiks.trackPageView();

  await resetModule();

  analitiks.setup("accountid");

  analitiks.trackPageView("/test/page");

  const before = new URL(fetch.firstCall.firstArg);
  const after = new URL(fetch.lastCall.firstArg);

  t.deepEqual(
    before.searchParams.get("cid"),
    after.searchParams.get("cid"),
    "the user id is the same"
  );
});

test("in anonymous the uid is refreshed across subequent navigations", async (t) => {
  analitiks.setup("accountid", true);

  analitiks.trackPageView();

  await resetModule();

  analitiks.setup("accountid", true);

  analitiks.trackPageView("/test/page");

  const before = new URL(fetch.firstCall.firstArg);
  const after = new URL(fetch.lastCall.firstArg);

  t.notDeepEqual(
    before.searchParams.get("cid"),
    after.searchParams.get("cid"),
    "the user id is refreshed"
  );
});
