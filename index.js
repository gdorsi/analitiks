let _accountId;
let _anonymize;
let _userId;

function id() {
  return Math.random() * 10 ** 8;
}

export function setup(accountId, anonymize) {
  _accountId = accountId;

  if (anonymize) {
    _anonymize = 1;
    return;
  }

  _anonymize = 0;

  try {
    _userId = localStorage.getItem("_ga_uid");
    if (!_userId) {
      _userId = id();
      localStorage.setItem("_ga_uid", _userId);
    }
  } catch (localStorageBlocked) {
    _userId = id();
  }
}

export function trackPageView(page = location.pathname) {
  send("pageview", serialize("dp", page));
}

export function trackEvent(eventCategory, eventAction, eventLabel, eventValue) {
  send("event", [
    serialize("ec", eventCategory),
    serialize("ea", eventAction),
    serialize("el", eventLabel),
    serialize("ev", eventValue),
  ]);
}

function send(hitType, params) {
  if (!_accountId) return;

  const url = `https://www.google-analytics.com/collect?${[
    `v=1`,
    `de=UTF-8`,
    serialize("aip", _anonymize),
    serialize("tid", _accountId),
    serialize("cid", _userId || id()),
    serialize("dl", document.location.href),
    serialize("ul", navigator.language.toLowerCase()),
    serialize("dt", document.title),
    serialize("dr", document.referrer),
    serialize("sd", screen.colorDepth + "-bit"),
    serialize("sr", `${screen.availWidth}-x-${screen.availHeight}`),
    serialize("vp", `${innerWidth}-x-${innerHeight}`),
    serialize("z", Date.now()),
    serialize("t", hitType),
  ]
    .concat(params)
    .filter(Boolean)
    .join("&")}`;

  fetch(url, {
    credentials: _anonymize && "omit",
  }).catch(() => {});
}

function serialize(key, value) {
  return value && `${key}=${encodeURIComponent(value)}`;
}
