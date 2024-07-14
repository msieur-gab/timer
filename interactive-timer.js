class InteractiveTimer {
    constructor() {
        this.container = document.getElementById('timer-container');
        this.handle = document.getElementById('timer-handle');
        this.content = document.getElementById('timer-content');
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
        this.containerHeight = 300; // Hauteur totale du conteneur en pixels
        this.handleHeight = 50; // Hauteur de la poignée en pixels

        this.init();
    }

    init() {
        this.handle.addEventListener('click', () => this.toggleContainer());
        this.container.addEventListener('touchstart', (e) => this.touchStart(e));
        this.container.addEventListener('touchmove', (e) => this.touchMove(e));
        this.container.addEventListener('touchend', () => this.touchEnd());
        this.updateContainerPosition(); // Position initiale
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
        let newY = (this.isOpen ? 0 : window.innerHeight - this.handleHeight) + deltaY;
        newY = Math.max(0, Math.min(newY, window.innerHeight - this.handleHeight));
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
        const y = this.isOpen ? 0 : window.innerHeight - this.handleHeight;
        this.container.style.transform = `translateY(${y}px)`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InteractiveTimer();
});
