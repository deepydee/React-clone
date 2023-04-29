const scripts = document.querySelectorAll('script[type="text/babel"]');

scripts.forEach((el) => {
  const js = convertToNativeJs(el.text);
  const script = document.createElement('script');
  script.text = js;
  document.querySelector('body').append(script);
});


function convertToNativeJs (code) {
  return Babel.transform(code, { presets: ["env"] }).code;
}
