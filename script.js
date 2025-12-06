// ------------------- SUPABASE SETUP -------------------
const SUPABASE_URL = 'https://rbvrcetionhmbfrvnzfl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v2hTmxnfr1Uybmy4U5viGw_HF8eNQru';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------- SHELF ID -------------------
let shelfId = new URLSearchParams(window.location.search).get('shelf');
if (!shelfId) shelfId = crypto.randomUUID();

// ------------------- PLACED TOYS ARRAY -------------------
let placedToys = [];

// ------------------- CLICK TO PLACE TOYS -------------------
document.querySelectorAll(".menu-toy").forEach(menuToy => {
  menuToy.addEventListener("click", () => {
    const clone = menuToy.cloneNode(true);
    clone.className = "placed-toy";

    clone.style.left = "100px";
    clone.style.top = "200px";

    makeDraggable(clone);

    // Add messages (locked until 12/25/25)
    clone.addEventListener("dblclick", () => {
      const now = new Date();
      const unlockDate = new Date(2025, 11, 25); // Dec 25, 2025

      if (now < unlockDate) {
        alert("Messages can only be added starting on December 25, 2025!");
        return;
      }

      const msg = prompt("Write a message for this toy:");
      if(msg) {
        let msgDiv = clone.querySelector(".toy-msg");
        if(!msgDiv) {
          msgDiv = document.createElement("div");
          msgDiv.className = "toy-msg";
          clone.appendChild(msgDiv);
        }
        msgDiv.innerText = msg;
      }
    });

    document.querySelector("#shelf-area").appendChild(clone);
    placedToys.push(clone);
  });
});

// ------------------- DRAG FUNCTION -------------------
function makeDraggable(el) {
  let offsetX, offsetY;

  el.addEventListener("mousedown", dragStart);
  el.addEventListener("touchstart", dragStart);

  function dragStart(e) {
    e.preventDefault();
    const rect = el.getBoundingClientRect();

    if(e.type === "mousedown") {
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      window.addEventListener("mousemove", dragMove);
      window.addEventListener("mouseup", dragEnd);
    } else {
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
      window.addEventListener("touchmove", dragMove);
      window.addEventListener("touchend", dragEnd);
    }
  }

  function dragMove(e) {
    e.preventDefault();
    let x = (e.type.startsWith("mouse") ? e.clientX : e.touches[0].clientX) - offsetX;
    let y = (e.type.startsWith("mouse") ? e.clientY : e.touches[0].clientY) - offsetY;
    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  function dragEnd() {
    window.removeEventListener("mousemove", dragMove);
    window.removeEventListener("mouseup", dragEnd);
    window.removeEventListener("touchmove", dragMove);
    window.removeEventListener("touchend", dragEnd);
  }
}

// ------------------- GET TOYS ARRAY -------------------
function getToysArray() {
  const toysArray = [];
  document.querySelectorAll(".placed-toy").forEach(toy => {
    const msgDiv = toy.querySelector(".toy-msg");
    toysArray.push({
      src: toy.src.split("/").pop(),
      x: parseInt(toy.style.left),
      y: parseInt(toy.style.top),
      message: msgDiv ? msgDiv.innerText : ""
    });
  });
  return toysArray;
}

// ------------------- SAVE SHELF -------------------
document.querySelector("#save-shelf").addEventListener("click", async () => {
  const shelfName = document.querySelector("#shelf-name").value || "My Shelf";
  const toysArray = getToysArray();

  const { data, error } = await supabase
    .from('shelves')
    .upsert({ id: shelfId, name: shelfName, toys: toysArray })
    .select();

  if(error) console.error(error);
  else alert("Shelf saved!");
});

// ------------------- LOAD SHELF -------------------
async function loadShelf(id) {
  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .eq('id', id)
    .single();

  if(error) return;

  const shelfArea = document.querySelector("#shelf-area");
  shelfArea.innerHTML = "";

  data.toys.forEach(t => {
    const clone = document.createElement("img");
    clone.src = "assets/" + t.src;
    clone.className = "placed-toy";
    clone.style.left = t.x + "px";
    clone.style.top = t.y + "px";
    clone.style.width = "70px";
    clone.style.height = "70px";

    // Add message if exists
    if(t.message) {
      const msgDiv = document.createElement("div");
      msgDiv.className = "toy-msg";
      msgDiv.innerText = t.message;
      clone.appendChild(msgDiv);
    }

    makeDraggable(clone);
    shelfArea.appendChild(clone);
  });
}

// Load existing shelf
if(shelfId) loadShelf(shelfId);

// ------------------- CHRISTMAS TIMER -------------------
function updateTimer() {
  const now = new Date();
  const christmas = new Date(now.getFullYear(), 11, 25);
  if(now > christmas) christmas.setFullYear(now.getFullYear() + 1);

  const diff = christmas - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("timer").innerText =
    `${days}d ${hours}h ${minutes}m ${seconds}s until Christmas`;
}

setInterval(updateTimer, 1000);
updateTimer();
