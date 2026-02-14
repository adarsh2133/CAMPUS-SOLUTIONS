// Optional: Dynamically load user information if necessary or handle events like logout
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.querySelector('.logout-btn');

    // Handle logout button click
    logoutButton.addEventListener('click', () => {
        // For example, clear sessionStorage or redirect
        alert("You have logged out!");
        window.location.href = "new.html"; // Redirect to home page
    });
});
