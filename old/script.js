// Lista loginów i haseł
const users = [
    { login: "lswierc", password: "Cuba43" },
    { login: "jkeller", password: "HasloMaslo" },
    { login: "apiekny", password: "ChickenNugget" },
    { login: "bfilus", password: "robocop" },
    { login: "ozdzuj", password: "Odra" },
    { login: "djasinski", password: "Redbull" },
    { login: "dfilla", password: "betclick" },
    { login: "aflorczak", password: "kasyno" },
    { login: "dbednorz", password: "Linux2137" },
    { login: "fkaramon", password: "Yamal10" },
    { login: "kgliwinski", password: "Victoria" },
    { login: "kwasik", password: "Cwel21" },
    { login: "kmichta", password: "Legenda" },
    { login: "dkaplun", password: "Reseller" }
];

function login() {
    const loginInput = document.getElementById("login").value;
    const passwordInput = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    // Sprawdzenie czy login i hasło pasują do któregoś użytkownika
    const foundUser = users.find(user =>
        user.login === loginInput && user.password === passwordInput
    );

    if (foundUser) {
        document.getElementById("login-container").classList.add("hidden");
        document.getElementById("notes-container").classList.remove("hidden");
        errorMessage.textContent = "";
    } else {
        errorMessage.textContent = "❌ Nieprawidłowy login lub hasło!";
    }
}

function logout() {
    document.getElementById("notes-container").classList.add("hidden");
    document.getElementById("login-container").classList.remove("hidden");
    document.getElementById("login").value = "";
    document.getElementById("password").value = "";
}
