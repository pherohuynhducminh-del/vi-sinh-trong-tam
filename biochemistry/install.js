if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.warn('Không thể bật chế độ ngoại tuyến.', error);
  });
}
