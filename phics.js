var Phics = (function () {
    function drawArc(ctx, x, y, radius, start, end, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.arc(x, y, radius, start, end);
        ctx.stroke();
    }

    function drawNeedle(ctx, x, y, radius, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, -radius + 32);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
    }

    function drawGauge(canvasId, percent) {
        var canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        var radius = Math.min(width, height) * 0.35;
        var centerX = width / 2;
        var centerY = height * 0.85;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(0, 0);

        drawArc(ctx, centerX, centerY, radius, Math.PI * 0.8, Math.PI * 0.2, '#2d3f5a', 20);
        drawArc(ctx, centerX, centerY, radius, Math.PI * 0.8, Math.PI * 0.35, '#26c281', 18);
        drawArc(ctx, centerX, centerY, radius, Math.PI * 0.35, Math.PI * 0.6, '#f7b731', 18);
        drawArc(ctx, centerX, centerY, radius, Math.PI * 0.6, Math.PI * 0.2, '#ff5d5d', 18);

        var targetAngle = Math.PI * 0.8 - (Math.PI * 0.6 * Math.min(percent, 100) / 100);
        drawNeedle(ctx, centerX, centerY, radius, targetAngle - Math.PI * 0.8, '#ffffff');

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 36px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(percent) + '%', centerX, centerY - radius * 0.15);

        ctx.fillStyle = '#a3b2d1';
        ctx.font = '500 15px Segoe UI';
        ctx.fillText('Load Ratio', centerX, centerY - radius * 0.15 + 32);
        ctx.restore();
    }

    function animateGauge(canvasId, from, to, duration) {
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var value = from + (to - from) * progress;
            drawGauge(canvasId, value);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    }

    return {
        animateGauge: animateGauge
    };
})();
