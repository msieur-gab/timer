class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, data) {
        const event = this.events[eventName];
        if (event) {
            event.forEach(callback => {
                callback.call(null, data);
            });
        }
    }

    removeListener(eventName, callback) {
        const event = this.events[eventName];
        if (event) {
            this.events[eventName] = event.filter(cb => cb !== callback);
        }
    }
}

export default EventEmitter;
