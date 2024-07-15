document.addEventListener("DOMContentLoaded", function() {
    var toolbarIcons = document.querySelectorAll(".toolbar-icon");

    toolbarIcons.forEach(function(icon) {
        icon.addEventListener("click", function() {
            // Rimuovi la classe 'active' da tutte le icone
            toolbarIcons.forEach(function(icon) {
                icon.classList.remove("active");
            });
            // Aggiungi la classe 'active' all'icona cliccata
            this.classList.add("active");
        });
    });
});
