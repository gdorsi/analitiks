import browserEnv from 'browser-env';

browserEnv();

Object.defineProperty(global, 'localStorage', {
    value: {
        state: {},
        setItem(k, v) {
            this.state[k] = `${v}`;
        },
        getItem(k) {
            return this.state[k];
        }
    }
});
