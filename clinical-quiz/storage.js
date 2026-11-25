// GitHub Pages paths on the same origin share browser storage.
const localStorage = {
  getItem(key) {
    return window.localStorage.getItem('clinical-quiz:' + key);
  },
  setItem(key, value) {
    window.localStorage.setItem('clinical-quiz:' + key, value);
  },
  removeItem(key) {
    window.localStorage.removeItem('clinical-quiz:' + key);
  }
};
