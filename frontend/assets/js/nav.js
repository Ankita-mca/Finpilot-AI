/**
 * FinPilot AI - Global Navigation & Layout Controller
 * Consistent Org Switcher, User Profile, Active Route, and Session Manager
 */
function initFinPilotLayout() {
  const userName = localStorage.getItem('finpilot_user_name') || 'Test User';
  const userEmail = localStorage.getItem('finpilot_user_email') || 'test@finpilot.local';
  const orgName = localStorage.getItem('finpilot_org_name') || 'Test Org';
  const orgRole = localStorage.getItem('finpilot_org_role') || 'owner account';

  // Update Org Switcher
  const orgNameEl = document.getElementById('sidebarOrgName');
  const orgRoleEl = document.getElementById('sidebarOrgRole');
  const orgAvatarEl = document.getElementById('sidebarOrgAvatar');
  if (orgNameEl) orgNameEl.textContent = orgName;
  if (orgRoleEl) orgRoleEl.textContent = orgRole;
  if (orgAvatarEl) orgAvatarEl.textContent = (orgName.charAt(0) || 'T').toUpperCase();

  // Update User Profile Card
  const userNameEl = document.getElementById('sidebarUserName');
  const userEmailEl = document.getElementById('sidebarUserEmail');
  const userAvatarEl = document.getElementById('sidebarUserAvatar');
  if (userNameEl) userNameEl.textContent = userName;
  if (userEmailEl) userEmailEl.textContent = userEmail;
  if (userAvatarEl) userAvatarEl.textContent = (userName.charAt(0) || 'T').toUpperCase();

  // Highlight active nav item matching current filename
  const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
  const navLinks = document.querySelectorAll('.sidebar .nav-item');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentFile) {
      link.classList.add('active');
    } else if (href && href !== '#' && href !== currentFile) {
      // Don't remove if already accurately marked
      if (currentFile !== '' && currentFile !== 'index.html') {
        link.classList.remove('active');
      }
    }
  });
}

function logout() {
  try {
    localStorage.removeItem('finpilot_token');
    localStorage.removeItem('finpilot_user');
    localStorage.removeItem('finpilot_user_name');
    localStorage.removeItem('finpilot_user_email');
    localStorage.removeItem('finpilot_org_name');
    localStorage.removeItem('finpilot_org_role');
  } catch (e) {}
  window.location.href = 'login.html';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFinPilotLayout);
} else {
  initFinPilotLayout();
}

