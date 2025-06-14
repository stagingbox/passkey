let passkeySettings = {
    server:    'server.php',
    login:     'index.html',
    create:    'create.html',
    dashboard: 'loggedin.html',
    company:   {
       domain: 'stagingbox.uk',
       name:   'Staging Box'
    }
};

async function createPasskey() {
    let email = document.getElementById('email').value;
    let username = document.getElementById('username').value;

    if (!email || !username) {
        alert("Email and Username are required!");
        return;
    }

    let publicKeyOptions = {
        challenge: new Uint8Array(32), // Random challenge from server
        rp: { id: passkeySettings.company.domain, name: passkeySettings.company.name },
        user: {
            id: new Uint8Array(16),
            name: email,
            displayName: username
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { residentKey: "required" },
    };

    let credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

    let response = await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({
            action: "register",
            credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.response.getPublicKey()))),
            email,
            username
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (data.success) {
        alert("Passkey created successfully!");
        window.location.href = passkeySettings.login;
    }
}

async function authenticateWithPasskey() {
    let publicKeyOptions = {
        challenge: new Uint8Array(32), // Random challenge from server
        allowCredentials: [], // Let the browser pick from saved credentials
        userVerification: "required"
    };

    let credential = await navigator.credentials.get({ publicKey: publicKeyOptions });

    let response = await fetch(passkeySettings.server, {
        method: 'POST',
        body: JSON.stringify({
            action: "login",
            credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (data.success) {
        alert("Authenticated successfully!");
        window.location.href = passkeySettings.dashboard;
    } else {
        alert("Authentication failed.");
    }
}
