class InteractiveTimer {
    constructor() {
        this.container = document.getElementById('timer-container');
        this.handle = document.getElementById('timer-handle');
        this.isOpen = false;
        this.isDragging = false;
        this.startY = 0;
        this.containerHeight = 300;
        this.handleHeight = 50;

        this.handle.addEventListener('mousedown', this.startDrag.bind(this));
        this.handle.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
        this.handle.addEventListener('click', this.handleClick.bind(this));

        this.updatePosition();
    }

    startDrag(e) {
        this.isDragging = true;
        this.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        this.container.style.transition = 'none';
        e.type === 'touchstart' && e.preventDefault();
    }

    drag(e) {
        if (!this.isDragging) return;
        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        let newY = Math.max(0, Math.min((this.isOpen ? 0 : this.containerHeight - this.handleHeight) + currentY - this.startY, this.containerHeight - this.handleHeight));
        this.container.style.transform = `translateY(${newY}px)`;
        e.type === 'touchmove' && e.preventDefault();
    }

    endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.container.style.transition = 'transform 0.3s ease-out';
        this.isOpen = parseInt(this.container.style.transform.replace('translateY(', '')) < (this.containerHeight - this.handleHeight) / 2;
        this.updatePosition();
    }

    handleClick(e) {
        if (!this.isDragging) this.isOpen = !this.isOpen;
        this.updatePosition();
        e.preventDefault();
    }

    updatePosition() {
        this.container.style.transform = `translateY(${this.isOpen ? 0 : this.containerHeight - this.handleHeight}px)`;
    }
}

document.addEventListener('DOMContentLoaded', () => new InteractiveTimer());
