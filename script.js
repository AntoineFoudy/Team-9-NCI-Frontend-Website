// API BASE URL

const API_URL = "http://108.131.153.250:8080";


/* =========================================
   LOGIN
   Sends a login request to the backend using
   the email and password entered by the user.
   if correct redirects user to dahsboard page
========================================= */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  // Clear previous error message before trying again
  if (errorEl) {
    errorEl.innerText = "";
  }

  try {
    // Send login request to backend
    const response = await fetch(
      `${API_URL}/login?loginEmail=${encodeURIComponent(email)}&loginPassword=${encodeURIComponent(password)}`
    );

    const data = await response.json();
    console.log(data);

    // Fallback to 1 if backend does not return a userId
    const userId = data.userId || 1;

    // Store logged-in user details locally
    localStorage.setItem("userId", userId);
    localStorage.setItem("userEmail", email);

    // Redirect user to dashboard after login
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);

    // Show error message if login fails
    if (errorEl) {
      errorEl.innerText = "Login failed";
    }
  }
}

/* =========================================
   SHOW USER DETAILS
   Displays the current userId on the page
========================================= */
function showUserDetails() {
  const userId = localStorage.getItem("userId");
  const userIdDisplay = document.getElementById("userIdDisplay");

  if (userIdDisplay) {
    userIdDisplay.innerText = userId || "Not available";
  }
}

/* =========================================
   NAVIGATION FUNCTIONS
   buttons to move between
   pages in the frontend.
========================================= */
function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToCreateEvent() {
  window.location.href = "create-event.html";
}

function goToViewEvents() {
  window.location.href = "view-events.html";
}

/* =========================================
   LOGOUT
   Removes locally stored login details and
   returns the user to the login page.
========================================= */
function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}

/* =========================================
   CREATE EVENT
   Sends a POST request to /schedule with the
   event details entered by the user.
   The backend stores the event for that user.
========================================= */
async function addEvent() {
  const description = document.getElementById("description")?.value || "";
  const dateTime = document.getElementById("dateTime").value;
  const latitude = document.getElementById("latitude").value;
  const longitude = document.getElementById("longitude").value;
  const userId = localStorage.getItem("userId");
  const messageEl = document.getElementById("eventMessage");

  // Clear previous message before validating/submitting
  if (messageEl) {
    messageEl.innerText = "";
  }

  //  validation so empty feields are not submitted
  if (!dateTime || !latitude || !longitude) {
    if (messageEl) {
      messageEl.innerText = "Please fill in all fields.";
    }
    return;
  }

  try {
    // POST request to create a new event
    await fetch(`${API_URL}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        description: description,
        dateTime: dateTime,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      })
    });

    //  message shown if successful
    if (messageEl) {
      messageEl.innerText = "Event added";
    }
  } catch (error) {
    console.error(error);

    // Error message shown in UI if fails
    if (messageEl) {
      messageEl.innerText = "Failed to add event";
    }
  }
}

/* =========================================
   GET EVENTS
   Fetches all events for the current user and
   displays them in the #events container.
========================================= */
async function getEvents() {
  const userId = localStorage.getItem("userId");
  const container = document.getElementById("events");
  const calendar = document.getElementById("calendar");
  const selectedDateEvents = document.getElementById("selected-date-events");

  // Stop function if the events container is missing
  if (!container) return;

  // Clear other sections so only the event list is visible
  container.innerHTML = "";
  if (calendar) calendar.innerHTML = "";
  if (selectedDateEvents) selectedDateEvents.innerHTML = "";

  try {
    // GET request to fetch this user's events
    const response = await fetch(`${API_URL}/schedule?userId=${userId}`);
    const events = await response.json();

    // Show message if no events are returned
    if (!events.length) {
      container.innerHTML = "<p>No events found.</p>";
      return;
    }

    // Create and display a card for each event
    events.forEach(event => {
      const div = document.createElement("div");
      div.className = "event";

      div.innerHTML = `
        <p><b>Date:</b> ${event.dateTime}</p>
        <p><b>Latitude:</b> ${event.latitude}</p>
        <p><b>Longitude:</b> ${event.longitude}</p>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load events</p>";
  }
}

/* =========================================
   VIEW CALENDAR
   shows monthly calendar for the current
   month and highlights on days
   that have events.

   When a calendar day is clicked, the events
   for that date are shown in a panel below
   the calendar .
========================================= */
async function viewCalendar() {
  const userId = localStorage.getItem("userId");

  // Main containers used on the page
  const calendar = document.getElementById("calendar");
  const eventsContainer = document.getElementById("events");
  const selectedDateEvents = document.getElementById("selected-date-events");

  // Clear previous event list, calendar, and selected-day panel
  calendar.innerHTML = "";
  if (eventsContainer) eventsContainer.innerHTML = "";
  if (selectedDateEvents) selectedDateEvents.innerHTML = "";

  try {
    // Fetch all events for the current user
    const events = await fetch(`${API_URL}/schedule?userId=${userId}`).then(res => res.json());

    // Get the current month and year from the system date
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Arrays lists used for readable month/day labels in the UI
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Find what weekday the month starts on
    const firstDay = new Date(year, month, 1).getDay();

    // Find how many days are in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build the main calendar structure:
    // 1. Month title
    // 2. Weekday labels
    // 3. Empty grid that day cells will be added into
    calendar.innerHTML = `
      <div class="calendar-title">${monthNames[month]} ${year}</div>
      <div class="calendar-weekdays">
        ${dayNames.map(day => `<div>${day}</div>`).join("")}
      </div>
      <div class="calendar-grid" id="calendar-grid"></div>
    `;

    const grid = document.getElementById("calendar-grid");

    
    for (let i = 0; i < firstDay; i++) {
      grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Create one calendar cell for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Filter events that belong to this exact calendar day
      const dayEvents = events.filter(e => {
        const d = new Date(e.dateTime);
        return (
          d.getDate() === day &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      });

      
      const cell = document.createElement("div");
      cell.className = "calendar-day";

      // Show day number and event marker if events exist
      cell.innerHTML = `
        <div class="day-number">${day}</div>
        ${
          dayEvents.length
            ? `<div class="event-marker">• ${dayEvents.length} Event${dayEvents.length > 1 ? "s" : ""}</div>`
            : ""
        }
      `;

      // When the user clicks a day:
      // - Show all events for that date
      // - If none exist, show "No events for this day"
      cell.onclick = () => {
        selectedDateEvents.innerHTML = `
          <div class="selected-events-box">
            <h3>Events on ${monthNames[month]} ${day}</h3>
            ${
              dayEvents.length
                ? dayEvents.map(e => `
                    <div class="selected-event-item">
                      <p><strong>Time:</strong> ${new Date(e.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</p>
                      <p><strong>Latitude:</strong> ${e.latitude}</p>
                      <p><strong>Longitude:</strong> ${e.longitude}</p>
                    </div>
                  `).join("")
                : "<p>No events for this day.</p>"
            }
          </div>
        `;
      };

      // Add finished day cell into the calendar grid
      grid.appendChild(cell);
    }
  } catch (error) {
    console.error(error);

    // Show error message in calendar area if fetch fails
    calendar.innerHTML = "<p>Failed to load calendar</p>";
  }
}