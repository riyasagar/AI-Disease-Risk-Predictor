document.addEventListener('DOMContentLoaded', async () => {
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const form = document.getElementById('change-password-form');
    const messageDiv = document.getElementById('form-message');

    // --- Fetch and display user details ---
    try {
        const response = await fetch('/api/user');
        if (!response.ok) throw new Error('Could not fetch user details.');
        
        const user = await response.json();
        userNameEl.textContent = user.name;
        userEmailEl.textContent = user.email;
    } catch (error) {
        userNameEl.textContent = 'Error';
        userEmailEl.textContent = 'Could not load details.';
        console.error(error);
    }

    // --- Handle password change form submission ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        // Clear previous messages
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';


        // Client-side validation
        if (newPassword.length < 8) {
            showMessage('New password must be at least 8 characters long.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showMessage('New passwords do not match.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.text();

            if (response.ok) {
                showMessage(result, 'success');
                form.reset(); // Clear form fields on success
            } else {
                showMessage(result, 'error');
            }
        } catch (error) {
            showMessage('An unexpected error occurred. Please try again.', 'error');
            console.error('Password change error:', error);
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
    }
});
