
// ======================================
// BLACKPINK CONCERT TICKET COLLECTION
// ======================================

// Mengambil elemen HTML
const ticketForm = document.getElementById("ticketForm");
const ticketList = document.getElementById("ticketList");
const emptyMessage = document.getElementById("emptyMessage");

const totalTickets = document.getElementById("totalTickets");
const totalLocations = document.getElementById("totalLocations");
const totalSpending = document.getElementById("totalSpending");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

const imageInput = document.getElementById("ticketImage");
const imagePreview = document.getElementById("imagePreview");

const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");

// Mengambil data dari localStorage
const STORAGE_KEY = "blackpinkTicketCollection";

let tickets = loadTickets();
let editingId = null;
let selectedImage = "";

// ======================================
// LOAD DAN SAVE DATA
// ======================================

function loadTickets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca data:", error);
    return [];
  }
}

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    return true;
  } catch (error) {
    alert(
      "Penyimpanan gagal. Ukuran foto mungkin terlalu besar. " +
      "Coba gunakan foto yang lebih kecil."
    );
    console.error("Gagal menyimpan data:", error);
    return false;
  }
}

// ======================================
// MEMBUAT ID UNIK
// ======================================

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString() +
    Math.random().toString(16).slice(2);
}

// ======================================
// MENGAMANKAN TEKS DARI INPUT USER
// ======================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[char];
  });
}

// ======================================
// FORMAT RUPIAH
// ======================================

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

// ======================================
// FORMAT TANGGAL
// ======================================

function formatDate(dateString) {
  if (!dateString) return "-";

  const parts = dateString.split("-");

  if (parts.length !== 3) return "-";

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// ======================================
// PREVIEW FOTO
// ======================================

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  selectedImage = "";
  imagePreview.innerHTML = "";

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Silakan pilih file gambar.");
    this.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Ukuran foto maksimal 2 MB.");
    this.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    selectedImage = event.target.result;

    imagePreview.innerHTML = `
      <img src="${selectedImage}" alt="Preview tiket">
    `;
  };

  reader.onerror = function () {
    alert("Foto tidak dapat dibaca.");
    imageInput.value = "";
  };

  reader.readAsDataURL(file);
});

// ======================================
// RESET FORM
// ======================================

function resetForm() {
  ticketForm.reset();

  editingId = null;
  selectedImage = "";

  imageInput.value = "";
  imagePreview.innerHTML = "";

  submitButton.textContent = "+ Add My Ticket";
  formTitle.innerHTML = 'Add New Ticket <span>♡</span>';

  cancelEdit.classList.add("hidden");
}

// ======================================
// MENAMBAHKAN DAN MENGEDIT TIKET
// ======================================

ticketForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const concertName =
    document.getElementById("concertName").value.trim();

  const concertDate =
    document.getElementById("concertDate").value;

  const location =
    document.getElementById("location").value.trim();

  const seat =
    document.getElementById("seat").value.trim();

  const price =
    document.getElementById("price").value;

  const status =
    document.getElementById("status").value;

  const notes =
    document.getElementById("notes").value.trim();

  if (!concertName || !concertDate || !location) {
    alert("Lengkapi nama konser, tanggal, dan lokasi.");
    return;
  }

  if (price !== "" && Number(price) < 0) {
    alert("Harga tiket tidak boleh negatif.");
    return;
  }

  const existingTicket = tickets.find(
    ticket => ticket.id === editingId
  );

  const ticketData = {
    id: editingId || createId(),
    concertName,
    concertDate,
    location,
    seat,
    price: Number(price) || 0,
    status,
    notes,
    image: selectedImage ||
      (existingTicket ? existingTicket.image : "")
  };

  if (editingId) {
    const index = tickets.findIndex(
      ticket => ticket.id === editingId
    );

    if (index !== -1) {
      tickets[index] = ticketData;
    }
  } else {
    tickets.push(ticketData);
  }

  if (!saveTickets()) return;

  resetForm();
  renderTickets();

  alert(
    editingId
      ? "Tiket berhasil diperbarui! 💗"
      : "Tiket berhasil ditambahkan! 🎀"
  );
});

// ======================================
// MENAMPILKAN TIKET
// ======================================

function renderTickets() {
  const keyword = searchInput.value.toLowerCase().trim();
  const selectedStatus = filterStatus.value;

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.concertName.toLowerCase().includes(keyword) ||
      ticket.location.toLowerCase().includes(keyword);

    const matchesStatus =
      selectedStatus === "All" ||
      ticket.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  updateStatistics();

  ticketList.innerHTML = filteredTickets.map(ticket => {
    const safeName = escapeHTML(ticket.concertName);
    const safeLocation = escapeHTML(ticket.location);
    const safeSeat = escapeHTML(ticket.seat || "-");
    const safeNotes = escapeHTML(ticket.notes || "No notes yet.");

    const statusClass = ticket.status.replace(/\s+/g, "-");

    const imageHTML = ticket.image
      ? `<img src="${ticket.image}" alt="Ticket photo">`
      : `<span>🎀</span>`;

    return `
      <article class="ticket-card">

        <div class="ticket-image">
          ${imageHTML}
        </div>

        <div class="ticket-content">

          <div class="ticket-top">
            <h3>${safeName}</h3>

            <span class="status status-${statusClass}">
              ${escapeHTML(ticket.status)}
            </span>
          </div>

          <div class="ticket-details">

            <p>📅 <strong>
              ${formatDate(ticket.concertDate)}
            </strong></p>

            <p>📍 <strong>
              ${safeLocation}
            </strong></p>

            <p>💺 Seat: <strong>
              ${safeSeat}
            </strong></p>

            <p>💰 Price: <strong>
              ${formatRupiah(ticket.price)}
            </strong></p>

          </div>

          <div class="ticket-notes">
            ♡ ${safeNotes}
          </div>

          <div class="ticket-actions">
            <button
              class="edit-button"
              data-action="edit"
              data-id="${ticket.id}">
              ✎ Edit
            </button>

            <button
              class="delete-button"
              data-action="delete"
              data-id="${ticket.id}">
              ✕ Delete
            </button>
          </div>

        </div>
      </article>
    `;
  }).join("");

  emptyMessage.classList.toggle(
    "hidden",
    filteredTickets.length > 0
  );

  if (filteredTickets.length === 0) {
    emptyMessage.querySelector("h3").textContent =
      tickets.length === 0
        ? "No tickets yet!"
        : "No matching tickets!";

    emptyMessage.querySelector("p").textContent =
      tickets.length === 0
        ? "Add your first BLACKPINK concert memory."
        : "Try another search or filter.";
  }
}

// ======================================
// MENGHITUNG STATISTIK
// ======================================

function updateStatistics() {
  const locations = new Set(
    tickets.map(ticket =>
      ticket.location.trim().toLowerCase()
    )
  );

  const spending = tickets.reduce(
    (total, ticket) => total + (Number(ticket.price) || 0),
    0
  );

  totalTickets.textContent = tickets.length;
  totalLocations.textContent = locations.size;
  totalSpending.textContent = formatRupiah(spending);
}

// ======================================
// EDIT DAN DELETE TIKET
// ======================================

ticketList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    editTicket(id);
  }

  if (action === "delete") {
    deleteTicket(id);
  }
});

function editTicket(id) {
  const ticket = tickets.find(item => item.id === id);

  if (!ticket) return;

  editingId = id;

  document.getElementById("concertName").value =
    ticket.concertName;

  document.getElementById("concertDate").value =
    ticket.concertDate;

  document.getElementById("location").value =
    ticket.location;

  document.getElementById("seat").value =
    ticket.seat;

  document.getElementById("price").value =
    ticket.price;

  document.getElementById("status").value =
    ticket.status;

  document.getElementById("notes").value =
    ticket.notes;

  selectedImage = ticket.image || "";

  imageInput.value = "";

  imagePreview.innerHTML = selectedImage
    ? `<img src="${selectedImage}" alt="Current ticket photo">`
    : "";

  submitButton.textContent = "Save Changes";
  formTitle.innerHTML = 'Edit Ticket <span>♡</span>';

  cancelEdit.classList.remove("hidden");

  document.getElementById("addTicket").scrollIntoView({
    behavior: "smooth"
  });
}

function deleteTicket(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this ticket?"
  );

  if (!confirmed) return;

  tickets = tickets.filter(ticket => ticket.id !== id);

  if (!saveTickets()) return;

  if (editingId === id) {
    resetForm();
  }

  renderTickets();
}

// ======================================
// CANCEL EDIT
// ======================================

cancelEdit.addEventListener("click", resetForm);

// ======================================
// SEARCH DAN FILTER
// ======================================

searchInput.addEventListener("input", renderTickets);

filterStatus.addEventListener("change", renderTickets);

// ======================================
// MENAMPILKAN DATA SAAT WEBSITE DIBUKA
// ======================================

renderTickets();
