export function smoothScrollToElement(elementId: string, duration: number = 1200) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startPosition = window.scrollY;
  // Adjust offset for header if needed (using 80px as an approximate header height)
  const offset = 80; 
  const targetPosition = element.getBoundingClientRect().top + startPosition - offset;
  const distance = targetPosition - startPosition;
  
  let startTime: number | null = null;

  // Custom easing function (easeOutQuart) for a nice spline effect
  function easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4);
  }

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easeOutQuart(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}
