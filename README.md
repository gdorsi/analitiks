# analitiks
A 650b Google Analytics client for performance maniacs

This project is a non-official implementation of a Google Analytics JS client.

It does not uses cookies so is intendend only for projects that doesn't have strict requirements on user-tracking on Anlytics.

## Installation

```sh
$ npm install analitiks
```

## Usage

```js
import { setup, trackPageView, trackEvent } from "https://cdn.skypack.dev/analitiks";

setup('UA-123456-1');
trackPageView();

document.getElementById('mybutton').addEventListener('click', () => {
    trackEvent('category', 'action', 'label', 1);
});
```

## Anonymous mode!

This client supports also an anonymous mode where:

- The flag ["anonymize ip"](https://support.google.com/analytics/answer/2763052?hl=en) is on
- the user id is randomized at each request
- No [credentials](https://fetch.spec.whatwg.org/#credentials) are sent

Example:
```js
import { setup, trackPageView, trackEvent } from "https://cdn.skypack.dev/analitiks";

setup('UA-123456-1', true /* enables anonymous mode */);
trackPageView();

document.getElementById('mybutton').addEventListener('click', () => {
    trackEvent('category', 'action', 'label', 1);
});
```
