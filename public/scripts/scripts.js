// Show message to user
function showMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
    setTimeout(() => {
        messagesDiv.innerHTML = '';
    }, 5000);
}

// Show temporary save indicator
function showSaveIndicator(element, success = true) {
    const indicator = document.createElement('span');
    indicator.className = `save-indicator ms-2 ${success ? 'text-success' : 'text-danger'}`;
    indicator.innerHTML = success ? '<i class="bi bi-check-circle"></i>' : '<i class="bi bi-x-circle"></i>';

    element.appendChild(indicator);
    setTimeout(() => indicator.classList.add('show'), 10);

    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => element.removeChild(indicator), 300);
    }, 2000);
}

// READ - Load all albums
async function loadAlbums() {
    try {
        const response = await fetch('/api/albums');
        const albums = await response.json();

        const albumList = document.getElementById('albumList');

        if (albums.length === 0) {
            albumList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-earbuds fs-1"></i>
                            <p>No albums found. Add to the database!</p>
                        </div>
                    `;
            return;
        }

        albumList.innerHTML = albums.map(album => `
                    <div class="card mb-3 album-card" data-album-id="${album._id}">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <strong>Band:</strong>
                                    <div class="editable-field" 
                                         data-field="band" 
                                         data-album-id="${album._id}"
                                         title="Click to edit band">${album.band}</div>
                                </div>
                                <div class="col-md-2">
                                    <strong>title:</strong>
                                    <div class="editable-field" 
                                         data-field="title" 
                                         data-album-id="${album._id}"
                                         title="Click to edit title">${album.title}</div>
                                </div>
                                <div class="col-md-2">
                                    <strong>Year:</strong>
                                    <div class="editable-field" 
                                         data-field="year" 
                                         data-album-id="${album._id}"
                                         title="Click to edit year">${album.year}</div>
                                </div>
                                <div class="col-md-3">
                                    <small class="text-muted">
                                        <i class="bi bi-tag"></i> ID: ${album._id}
                                    </small>
                                </div>
                                <div class="col-md-2 text-end">
                                    <button class="btn btn-outline-danger btn-sm" 
                                            onclick="deleteAlbum('${album._id}', '${album.title}')">
                                        <i class="bi bi-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');

        // Add click event listeners for inline editing
        addInlineEditListeners();

        showMessage(`Loaded ${albums.length} albums. Click any field to edit!`, 'info');
    } catch (error) {
        showMessage(`❌ Error loading albums: ${error.message}`, 'danger');
    }
}

// Add inline editing functionality
function addInlineEditListeners() {
    document.querySelectorAll('.editable-field').forEach(field => {
        field.addEventListener('click', function () {
            if (this.querySelector('input')) return; // Already editing

            const currentValue = this.textContent;
            const fieldType = this.getAttribute('data-field');
            const albumId = this.getAttribute('data-album-id');

            // Create input element
            const input = document.createElement('input');
            input.type = fieldType === 'year' ? 'number' : 'text';
            input.value = currentValue;
            input.className = 'form-control form-control-sm';


            // Add styling for editing state
            this.classList.add('editing');
            this.innerHTML = '';
            this.appendChild(input);

            // Focus and select the input
            input.focus();
            input.select();

            // Save on Enter or blur
            const saveEdit = async () => {
                const newValue = input.value.trim();

                if (!newValue) {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                    showMessage('❌ Value cannot be empty', 'warning');
                    return;
                }

                if (newValue === currentValue) {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                    return;
                }

                // Update in database
                const success = await updateAlbumField(albumId, fieldType, newValue);

                if (success) {
                    this.textContent = newValue;
                    showSaveIndicator(this, true);
                } else {
                    this.textContent = currentValue;
                    showSaveIndicator(this, false);
                }

                this.classList.remove('editing');
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                } else if (e.key === 'Escape') {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                }
            });
        });
    });
}

// UPDATE - Update single field
async function updateAlbumField(albumId, field, value) {
    try {
        const updateData = {};
        updateData[field] = field === 'year' ? parseInt(value) : value;

        const response = await fetch(`/api/albums/${albumId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`, 'success');
            return true;
        } else {
            showMessage(`❌ Error: ${result.error}`, 'danger');
            return false;
        }
    } catch (error) {
        showMessage(`❌ Network error: ${error.message}`, 'danger');
        return false;
    }
}

// DELETE - Delete album
async function deleteAlbum(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/albums/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`✅ Album "${title}" deleted successfully!`, 'success');

            // Animate removal
            const albumCard = document.querySelector(`[data-album-id="${id}"]`);
            if (albumCard) {
                albumCard.style.opacity = '0';
                albumCard.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    albumCard.remove();
                }, 300);
            }
        } else {
            showMessage(`❌ Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`❌ Network error: ${error.message}`, 'danger');
    }
}

// Cleanup Database
async function cleanupDatabase() {
    if (!confirm('⚠️ This will DELETE ALL albums from the database. Are you sure?')) {
        return;
    }

    try {
        showMessage('🧹 Cleaning database...', 'info');
        const response = await fetch('/api/cleanup', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`✅ ${result.message}`, 'success');
            loadAlbums();
        } else {
            showMessage(`❌ Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`❌ Network error: ${error.message}`, 'danger');
    }
}

document.addEventListener('DOMContentLoaded', function() {

// CREATE - Add new album
document.getElementById('addAlbumForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const album = {
        band: document.getElementById('band').value,
        title: document.getElementById('title').value,
        year: parseInt(document.getElementById('year').value)

    };

    try {
        const response = await fetch('/api/albums', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(album)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`✅ Album "${album.title}" added successfully!`, 'success');
            document.getElementById('addAlbumForm').reset();
            loadAlbums();
        } else {
            showMessage(`❌ Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`❌ Network error: ${error.message}`, 'danger');
    }
});

// Load albums when page loads
    loadAlbums();
});
