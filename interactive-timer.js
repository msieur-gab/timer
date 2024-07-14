class InteractiveTimer {
    constructor() {
        this.container = document.getElementById('timer-container');
        this.handle = document.getElementById('timer-handle');
        this.content = document.getElementById('timer-content');
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;

        this.init();
    }

    init() {
        this.handle.addEventListener('click', () => this.toggleContainer());
        this.container.addEventListener('touchstart', (e) => this.touchStart(e));
        this.container.addEventListener('touchmove', (e) => this.touchMove(e));
        this.container.addEventListener('touchend', () => this.touchEnd());
    }

    toggleContainer() {
        this.isOpen = !this.isOpen;
        this.updateContainerPosition();
    }

    touchStart(e) {
        this.startY = e.touches[0].clientY;
        this.container.style.transition = 'none';
    }

    touchMove(e) {
        this.currentY = e.touches[0].clientY;
        let deltaY = this.currentY - this.startY;
        let newY = (this.isOpen ? 0 : window.innerHeight - 50) + deltaY;
        newY = Math.max(50, Math.min(newY, window.innerHeight - 50));
        this.container.style.transform = `translateY(${newY}px)`;
    }

    touchEnd() {
        this.container.style.transition = 'transform 0.3s ease-out';
        if (Math.abs(this.currentY - this.startY) > 50) {
            this.isOpen = this.currentY < this.startY;
        }
        this.updateContainerPosition();
    }

    updateContainerPosition() {
        const y = this.isOpen ? 0 : window.innerHeight - 50;
        this.container.style.transform = `translateY(${y}px)`;
    }
}

// Initialiser le timer interactif quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveTimer();
});
