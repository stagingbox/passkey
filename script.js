class PasskeyJS {
    constructor() {
        this.settings = {
            server:      'server.php',
            login:       'index.html',
            dashboard:   'dashboard.html',
            containerid: 'passkey',
            company:     'Staging Box',
            debug:       1
        };
        this.container = null;
    }

    debugLog(...args) {
        if (this.settings.debug) console.log(...args);
    }

    load(containerId = null) {
        let targetId = containerId || this.settings.containerid;
        let container = document.getElementById(targetId);

        if (!container) {
            this.debugLog("Container not found:", targetId);
            return;
        }

        this.container = container;
        this.debugLog("Initializing UI in container:", container);

        container.innerHTML = ''; // Clear existing buttons before adding new ones

        let loginButton = document.createElement("button");
        loginButton.textContent = "Login with Passkey";
        loginButton.onclick = () => this.authenticateWithPasskey();

        let registerButton = document.createElement("button");
        registerButton.textContent = "Create Passkey";
        registerButton.onclick = () => this.createPasskey();

        container.appendChild(loginButton);
        container.appendChild(registerButton);
    }

    async create() {
        let email = prompt("Enter your email:");
        let username = prompt("Enter your username:");

        if (!email || !username) {
            alert("Email and Username are required!");
            return;
        }

        this.debugLog("Starting passkey creation...", { email, username });

        let response = await fetch(this.settings.server, {
            method: 'POST',
            body: JSON.stringify({ action: "getChallenge" }),
            headers: { 'Content-Type': 'application/json' }
        });

        let data = await response.json();
        this.debugLog("Challenge received from server:", data.challenge);

        let challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));

        let publicKeyOptions = {
            challenge: challenge,
            rp: { id: window.location.hostname, name: this.settings.company.name },
            user: {
                id: crypto.getRandomValues(new Uint8Array(16)),
                name: email,
                displayName: username
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: { residentKey: "required" }
        };

        this.debugLog("PublicKey creation options:", publicKeyOptions);

        let credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
        this.debugLog("Credential created successfully:", credential);

        await fetch(this.settings.server, {
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

        this.debugLog("Passkey registration completed.");
        alert("Passkey created successfully!");
        window.location.href = this.settings.login;
    }

    async authenticate() {
        this.debugLog("Starting passkey authentication...");

        let response = await fetch(this.settings.server, {
            method: 'POST',
            body: JSON.stringify({ action: "getChallenge" }),
            headers: { 'Content-Type': 'application/json' }
        });

        let data = await response.json();
        this.debugLog("Authentication challenge received:", data.challenge);

        let challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));

        let credentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [],
            userVerification: "required",
            rpId: window.location.hostname
        };

        this.debugLog("Credential request options:", credentialRequestOptions);

        let credential = await navigator.credentials.get({ publicKey: credentialRequestOptions });
        this.debugLog("Passkey retrieved:", credential);

        let loginResponse = await fetch(this.settings.server, {
            method: 'POST',
            body: JSON.stringify({
                action: "login",
                credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        let loginData = await loginResponse.json();
        this.debugLog("Login response:", loginData);

        if (loginData.success) {
            this.debugLog("Authenticated successfully!");
            window.location.href = this.settings.dashboard;
        } else {
            this.debugLog("Authentication failed.");
            alert("Authentication failed.");
        }
    }
}

window.passkey = new PasskeyJS();

// **Self-Initializing if an element with ID 'passkey' exists**
window.onload = () => {
    if (document.getElementById("passkey")) {
        passkey.load();
    }
};
