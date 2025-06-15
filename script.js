let passkeySettings = {
    server:    'server.php',
    login:     'index.html',
    create:    'create.html',
    dashboard: 'loggedin.html',
    company:   {
       domain: 'stagingbox.uk',
       name:   'Staging Box'
    },
    debug: 1 // Set to 1 to enable logging, 0 to disable
};

// Utility function for controlled logging
function debugLog(...args) {
    if (passkeySettings.debug) {
        console.log(...args);
    }
}

async function createPasskey() {
    let email = document.getElementById('email').value;
    let username = document.getElementById('username').value;

    if (!email || !username) {
        alert("Email and Username are required!");
        return;
    }

    debugLog("Starting passkey creation...");
    debugLog("User details:", { email, username });

    let response = await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({ action: "getChallenge" }),
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    debugLog("Challenge received from server:", data.challenge);

    let challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));

    let publicKeyOptions = {
        challenge: challenge,
        rp: { id: window.location.hostname, name: passkeySettings.company.name },
        user: {
            id: crypto.getRandomValues(new Uint8Array(16)), // Generates a valid binary user ID
            name: email,
            displayName: username
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { residentKey: "required" }
    };

    debugLog("PublicKey creation options:", publicKeyOptions);

    let credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
    debugLog("Credential created successfully:", credential);

    await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({
            action: "register",
            credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
	    email,
            username
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    debugLog("Passkey registration completed.");
    alert("Passkey created successfully!");
    window.location.href = passkeySettings.login;
}

async function authenticateWithPasskey() {
    debugLog("Starting passkey authentication...");

    let response = await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({ action: "getChallenge" }),
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    debugLog("Authentication challenge received:", data.challenge);

    let challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));

    let credentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [],
        userVerification: "required",
        rpId: window.location.hostname
    };

    debugLog("Credential request options:", credentialRequestOptions);

    let credential = await navigator.credentials.get({ publicKey: credentialRequestOptions });
    debugLog("Passkey retrieved:", credential);

    let loginResponse = await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({
            action: "login",
            credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    let loginData = await loginResponse.json();
    debugLog("Login response:", loginData);

    if (loginData.success) {
        alert("Authenticated successfully!");
        window.location.href = passkeySettings.dashboard;
    } else {
        alert("Authentication failed.");
    }
}
