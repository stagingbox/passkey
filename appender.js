function appendScript(scriptPath) {
    const script = document.createElement('script');
    script.src = `${scriptPath}?v=${new Date().getTime()}`;
    document.body.appendChild(script);
}
