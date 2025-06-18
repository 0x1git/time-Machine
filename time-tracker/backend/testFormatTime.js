function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) {
    return "0h 0m";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  // If less than 1 minute, show seconds for clarity
  if (hours === 0 && minutes === 0 && remainingSeconds > 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${hours}h ${minutes}m`;
}

console.log('0 seconds formats to:', formatTime(0));
console.log('6 seconds formats to:', formatTime(6));
console.log('59 seconds formats to:', formatTime(59));
console.log('60 seconds formats to:', formatTime(60));
console.log('63 seconds formats to:', formatTime(63));
console.log('2500 seconds formats to:', formatTime(2500));
console.log('2437 seconds formats to:', formatTime(2437));
