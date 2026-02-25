// Function to dynamically populate the profile section
function loadProfile() {
    const profileSection = document.getElementById('profile-section');

    // Example profile data (This could come from a database or session)
    const user = {
        name: 'Mantri',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        email: 'Mantri@example.com',
    };

    // Create the profile section elements dynamically
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile-details');

    // Create the profile picture
    const profileImage = document.createElement('img');
    profileImage.src = user.image;
    profileImage.alt = 'Profile Picture';
    profileImage.classList.add('profile-img');

    // Create the profile name
    const profileName = document.createElement('span');
    profileName.textContent = user.name;
    profileName.classList.add('profile-name');

    // Create the dropdown
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown-menu');
    
    // Add dropdown items (Profile options)
    const options = ['Profile', 'Settings', 'Logout'];
    options.forEach(option => {
        const link = document.createElement('a');
        
        // Update the "Profile" option to link to profile.html
        if (option === 'Profile') {
            link.href = 'profile.html';  // Link to the profile page
        } else {
            link.href = `#${option.toLowerCase()}`;  // For other options
        }
        
        link.textContent = option;
        dropdown.appendChild(link);
    });

    // Append the elements to the profile section
    profileDiv.appendChild(profileImage);
    profileDiv.appendChild(profileName);
    profileDiv.appendChild(dropdown);

    profileSection.appendChild(profileDiv);
}

// Load the profile section when the page is ready
window.onload = loadProfile;
