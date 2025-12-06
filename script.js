// ------------------- SUPABASE SETUP -------------------
const SUPABASE_URL = 'https://ofqrejletghhwaozpgpo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AwqYo5KQuGXhMO14lIZinw_j8BexXG-';
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

    // Default position
    clone.style.left = "100px";
    clone.style.top = "100px";

    // Make draggable
    makeDraggable(clone);

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
    toysArray.push({
      src: toy.src.split("/").pop(),
      x: parseInt(toy.style.left),
      y: parseInt(toy.style.top)
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

    makeDraggable(clone);
    shelfArea.appendChild(clone);
  });
}

// Load shelf if exists
if(shelfId) loadShelf(shelfId);

// ------------------- SHARE SHELF -------------------
document.querySelector("#share-shelf").addEventListener("click", () => {
  const url = `${window.location.origin}?shelf=${shelfId}`;
  navigator.clipboard.writeText(url);
  alert("Link copied! Share your shelf:\n" + url);
});

// ------------------- CHRISTMAS COUNTDOWN -------------------
function updateTimer() {
  const now = new Date();
  const xmas = new Date("December 25, 2025 00:00:00");
  const diff = xmas - now;

  if(diff < 0) {
    document.getElementById("timer").innerText = "Merry Christmas!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff/(1000*60*60))%24);
  const minutes = Math.floor((diff/(1000*60))%60);
  const seconds = Math.floor((diff/1000)%60);

  document.getElementById("timer").innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateTimer, 1000);
updateTimer();
