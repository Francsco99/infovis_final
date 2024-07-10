// script.js
document.addEventListener("DOMContentLoaded", function() {
    var popup = document.getElementById("popup");
    var closeBtn = document.querySelector(".close");
    var helpIcon = document.getElementById("help-icon"); // Seleziona l'icona usando l'ID

    // Mostra il popup all'apertura della pagina
    popup.style.display = "flex";

    // Chiudi il popup quando si clicca sulla 'x'
    closeBtn.onclick = function() {
        popup.style.display = "none";
    };

    // Chiudi il popup quando si clicca al di fuori del popup
    window.onclick = function(event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    };

    // Mostra il popup quando si clicca sull'icona di aiuto
    helpIcon.onclick = function() {
        popup.style.display = "flex";
    };
});