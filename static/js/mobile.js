/**
 * Mobile-specific JavaScript enhancements for JW Attendant Scheduler
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile detection
    const isMobile = window.innerWidth <= 768;
    const isTouch = 'ontouchstart' in window;
    
    // Initialize mobile features
    if (isMobile) {
        initMobileFeatures();
    }
    
    if (isTouch) {
        initTouchFeatures();
    }
    
    // Responsive table handling
    initResponsiveTables();
    
    // Pull-to-refresh functionality
    initPullToRefresh();
    
    // Mobile navigation
    initMobileNavigation();
    
    // Form enhancements
    initMobileFormEnhancements();
});

/**
 * Initialize mobile-specific features
 */
function initMobileFeatures() {
    // Add mobile class to body
    document.body.classList.add('mobile-device');
    
    // Convert tables to mobile cards on small screens
    convertTablesToCards();
    
    // Initialize swipe actions
    initSwipeActions();
    
    // Add floating action buttons where appropriate
    addFloatingActionButtons();
    
    // Optimize modals for mobile
    optimizeModalsForMobile();
}

/**
 * Initialize touch-specific features
 */
function initTouchFeatures() {
    // Add touch class to body
    document.body.classList.add('touch-device');
    
    // Add touch feedback to buttons
    addTouchFeedback();
    
    // Initialize touch gestures
    initTouchGestures();
}

/**
 * Convert tables to mobile-friendly card layout
 */
function convertTablesToCards() {
    const tables = document.querySelectorAll('.table-responsive table');
    
    tables.forEach(table => {
        if (window.innerWidth <= 768) {
            const cardContainer = createCardContainer(table);
            table.parentNode.insertBefore(cardContainer, table);
            table.style.display = 'none';
        }
    });
}

/**
 * Create card container from table data
 */
function createCardContainer(table) {
    const container = document.createElement('div');
    container.className = 'mobile-card-list d-md-none';
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const card = document.createElement('div');
        card.className = 'mobile-card-item';
        
        // Create card title from first cell
        if (cells.length > 0) {
            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = cells[0].textContent.trim();
            card.appendChild(title);
        }
        
        // Create card content from remaining cells
        cells.forEach((cell, index) => {
            if (index > 0 && headers[index]) {
                const detail = document.createElement('div');
                detail.className = 'card-detail';
                detail.innerHTML = `<strong>${headers[index]}:</strong> ${cell.textContent.trim()}`;
                card.appendChild(detail);
            }
        });
        
        // Add action buttons if present
        const actionCell = row.querySelector('.actions, .btn-group');
        if (actionCell) {
            const actions = document.createElement('div');
            actions.className = 'card-actions';
            actions.innerHTML = actionCell.innerHTML;
            card.appendChild(actions);
        }
        
        container.appendChild(card);
    });
    
    return container;
}

/**
 * Initialize swipe actions for list items
 */
function initSwipeActions() {
    const swipeItems = document.querySelectorAll('.mobile-card-item, .assignment-item');
    
    swipeItems.forEach(item => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        item.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            item.style.transition = 'none';
        });
        
        item.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            
            if (diffX > 0) {
                item.style.transform = `translateX(-${Math.min(diffX, 100)}px)`;
            }
        });
        
        item.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diffX = startX - currentX;
            item.style.transition = 'transform 0.2s ease';
            
            if (diffX > 50) {
                item.classList.add('swiped');
                item.style.transform = 'translateX(-100px)';
                showSwipeActions(item);
            } else {
                item.classList.remove('swiped');
                item.style.transform = 'translateX(0)';
            }
            
            isDragging = false;
        });
    });
}

/**
 * Show swipe actions for an item
 */
function showSwipeActions(item) {
    // Remove existing swipe actions
    const existingActions = item.querySelector('.swipe-actions');
    if (existingActions) {
        existingActions.remove();
    }
    
    // Create swipe actions
    const actions = document.createElement('div');
    actions.className = 'swipe-actions';
    
    // Add edit action
    const editAction = document.createElement('a');
    editAction.className = 'swipe-action edit';
    editAction.innerHTML = '<i class="fas fa-edit"></i>';
    editAction.href = '#';
    editAction.onclick = () => editItem(item);
    actions.appendChild(editAction);
    
    // Add delete action
    const deleteAction = document.createElement('a');
    deleteAction.className = 'swipe-action delete';
    deleteAction.innerHTML = '<i class="fas fa-trash"></i>';
    deleteAction.href = '#';
    deleteAction.onclick = () => deleteItem(item);
    actions.appendChild(deleteAction);
    
    item.appendChild(actions);
}

/**
 * Add floating action buttons
 */
function addFloatingActionButtons() {
    const currentPath = window.location.pathname;
    
    // Add FAB for attendant list
    if (currentPath.includes('/attendants/')) {
        addFAB('plus', 'Add Attendant', () => {
            window.location.href = '/scheduler/attendants/create/';
        });
    }
    
    // Add FAB for assignment list
    if (currentPath.includes('/assignments/')) {
        addFAB('plus', 'Add Assignment', () => {
            window.location.href = '/scheduler/assignments/create/';
        });
    }
}

/**
 * Add a floating action button
 */
function addFAB(icon, title, onClick) {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.title = title;
    fab.innerHTML = `<i class="fas fa-${icon}"></i>`;
    fab.onclick = onClick;
    
    document.body.appendChild(fab);
}

/**
 * Initialize pull-to-refresh functionality
 */
function initPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const threshold = 100;
    
    const pullIndicator = document.createElement('div');
    pullIndicator.className = 'pull-to-refresh';
    pullIndicator.textContent = 'Pull to refresh';
    pullIndicator.style.display = 'none';
    
    document.body.insertBefore(pullIndicator, document.body.firstChild);
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            isPulling = true;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
            e.preventDefault();
            pullIndicator.style.display = 'block';
            
            if (pullDistance > threshold) {
                pullIndicator.textContent = 'Release to refresh';
                pullIndicator.classList.add('active');
            } else {
                pullIndicator.textContent = 'Pull to refresh';
                pullIndicator.classList.remove('active');
            }
        }
    });
    
    document.addEventListener('touchend', () => {
        if (!isPulling) return;
        
        const pullDistance = currentY - startY;
        
        if (pullDistance > threshold) {
            pullIndicator.textContent = 'Refreshing...';
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            pullIndicator.style.display = 'none';
            pullIndicator.classList.remove('active');
        }
        
        isPulling = false;
    });
}

/**
 * Initialize mobile navigation enhancements
 */
function initMobileNavigation() {
    const navToggler = document.querySelector('.navbar-toggler');
    const navCollapse = document.querySelector('.navbar-collapse');
    
    if (navToggler && navCollapse) {
        // Close navigation when clicking outside
        document.addEventListener('click', (e) => {
            if (!navCollapse.contains(e.target) && !navToggler.contains(e.target)) {
                if (navCollapse.classList.contains('show')) {
                    navToggler.click();
                }
            }
        });
        
        // Close navigation when clicking on a link
        const navLinks = navCollapse.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navCollapse.classList.contains('show')) {
                    setTimeout(() => navToggler.click(), 100);
                }
            });
        });
    }
}

/**
 * Initialize responsive table handling
 */
function initResponsiveTables() {
    const tables = document.querySelectorAll('.table-responsive');
    
    tables.forEach(table => {
        // Add horizontal scroll indicators
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'table-scroll-indicator';
        scrollIndicator.textContent = '← Scroll to see more →';
        scrollIndicator.style.textAlign = 'center';
        scrollIndicator.style.fontSize = '0.8rem';
        scrollIndicator.style.color = '#6c757d';
        scrollIndicator.style.padding = '0.5rem';
        
        table.appendChild(scrollIndicator);
        
        // Hide indicator when table is fully visible
        table.addEventListener('scroll', () => {
            const isScrollable = table.scrollWidth > table.clientWidth;
            scrollIndicator.style.display = isScrollable ? 'block' : 'none';
        });
    });
}

/**
 * Add touch feedback to interactive elements
 */
function addTouchFeedback() {
    const interactiveElements = document.querySelectorAll('button, .btn, .card, .list-group-item, .nav-link');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', () => {
            element.style.opacity = '0.7';
        });
        
        element.addEventListener('touchend', () => {
            setTimeout(() => {
                element.style.opacity = '';
            }, 150);
        });
        
        element.addEventListener('touchcancel', () => {
            element.style.opacity = '';
        });
    });
}

/**
 * Initialize touch gestures
 */
function initTouchGestures() {
    // Double tap to scroll to top
    let lastTap = 0;
    
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            if (window.scrollY > 100) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }
        
        lastTap = currentTime;
    });
}

/**
 * Initialize mobile form enhancements
 */
function initMobileFormEnhancements() {
    // Auto-focus first input on modal show
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('shown.bs.modal', () => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        });
    });
    
    // Add loading states to form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner"></span> ' + submitBtn.textContent;
            }
        });
    });
    
    // Improve select dropdowns on mobile
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        if (isMobile) {
            select.setAttribute('size', '1');
        }
    });
}

/**
 * Optimize modals for mobile
 */
function optimizeModalsForMobile() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Make modals full-screen on small devices
        if (window.innerWidth <= 576) {
            modal.classList.add('modal-fullscreen-sm-down');
        }
        
        // Prevent body scroll when modal is open
        modal.addEventListener('shown.bs.modal', () => {
            document.body.style.overflow = 'hidden';
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.style.overflow = '';
        });
    });
}

/**
 * Handle window resize events
 */
window.addEventListener('resize', debounce(() => {
    const isMobileNow = window.innerWidth <= 768;
    
    if (isMobileNow && !document.body.classList.contains('mobile-device')) {
        initMobileFeatures();
    } else if (!isMobileNow && document.body.classList.contains('mobile-device')) {
        // Clean up mobile features
        document.body.classList.remove('mobile-device');
        
        // Show tables, hide cards
        const tables = document.querySelectorAll('.table-responsive table');
        tables.forEach(table => {
            table.style.display = '';
        });
        
        const cardContainers = document.querySelectorAll('.mobile-card-list');
        cardContainers.forEach(container => {
            container.style.display = 'none';
        });
    }
}, 250));

/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility functions for swipe actions
 */
function editItem(item) {
    // Extract item ID and redirect to edit page
    const itemId = item.dataset.id;
    if (itemId) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/attendants/')) {
            window.location.href = `/scheduler/attendants/${itemId}/edit/`;
        } else if (currentPath.includes('/assignments/')) {
            window.location.href = `/scheduler/assignments/${itemId}/edit/`;
        }
    }
}

function deleteItem(item) {
    if (confirm('Are you sure you want to delete this item?')) {
        const itemId = item.dataset.id;
        if (itemId) {
            // Submit delete form or make AJAX request
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.location.pathname + itemId + '/delete/';
            
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
            if (csrfToken) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrfToken.value;
                form.appendChild(csrfInput);
            }
            
            document.body.appendChild(form);
            form.submit();
        }
    }
}

// Export functions for use in other scripts
window.MobileEnhancements = {
    initMobileFeatures,
    initTouchFeatures,
    convertTablesToCards,
    addFAB
};
