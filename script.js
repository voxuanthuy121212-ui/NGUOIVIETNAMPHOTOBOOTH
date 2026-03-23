// 1. Bảo vệ tác quyền
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// 2. Biến số
const v1 = document.getElementById('webcam-1'), v2 = document.getElementById('webcam-2');
const r1 = document.getElementById('result-1'), r2 = document.getElementById('result-2');
const btnCap = document.getElementById('btn-capture');
const btnUpload = document.getElementById('btn-upload'); 
const fileInput = document.getElementById('file-input');
const btnRe = document.getElementById('btn-retake');
const btnDown = document.getElementById('btn-download');
const countEl1 = document.getElementById('countdown-1');
const countEl2 = document.getElementById('countdown-2');
const canvas = document.createElement('canvas'); 
const mainBg = document.getElementById('main-bg');

let step = 1; 

// 3. Mở Camera (Thêm lệnh .play() để chắc chắn hiện hình trên iPhone)
async function startCamera() {
    const constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        v1.srcObject = stream; v2.srcObject = stream;
        v1.play(); v2.play(); // Ép camera chạy ngay lập tức
    } catch (err) { alert("Hãy cho phép quyền truy cập Camera nhé!"); }
}
startCamera();

// 4A. Logic CHỤP ẢNH (CHỐNG NHẢY ZOOM)
btnCap.onclick = () => {
    if (step > 2) { step = 1; r1.style.display = 'none'; r2.style.display = 'none'; }
    const currentCountEl = step === 1 ? countEl1 : countEl2;
    currentCountEl.style.display = 'block';
    let count = 3; currentCountEl.innerText = count;

    let timer = setInterval(() => {
        count--;
        if (count > 0) currentCountEl.innerText = count;
        else {
            clearInterval(timer);
            currentCountEl.style.display = 'none';

            const currentV = step === 1 ? v1 : v2;
            const currentR = step === 1 ? r1 : r2;

            const ctx = canvas.getContext('2d');
            
            // Lấy kích thước thực tế của khung hiển thị trên màn hình
            const rect = currentV.getBoundingClientRect();
            canvas.width = rect.width * 2; // Nhân 2 để ảnh sắc nét hơn
            canvas.height = rect.height * 2;

            // Tính toán tỷ lệ để chụp đúng những gì đang "Cover" trong khung
            const videoRatio = currentV.videoWidth / currentV.videoHeight;
            const canvasRatio = canvas.width / canvas.height;

            let sw, sh, sx, sy;
            if (videoRatio > canvasRatio) {
                sw = currentV.videoHeight * canvasRatio; sh = currentV.videoHeight;
                sx = (currentV.videoWidth - sw) / 2; sy = 0;
            } else {
                sw = currentV.videoWidth; sh = currentV.videoWidth / canvasRatio;
                sx = 0; sy = (currentV.videoHeight - sh) / 2;
            }

            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(currentV, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            currentR.src = canvas.toDataURL('image/png');
            currentR.style.display = 'block';
            
            // Ép ảnh chụp xong phải khớp 100% khung
            currentR.style.width = '100%'; currentR.style.height = '100%';
            currentR.style.objectFit = 'cover';
            currentR.style.transform = 'none';
            currentR.classList.remove('decor-draggable');

            step++; updateButtons();
        }
    }, 1000);
};

// 4B. TẢI ẢNH TỪ MÁY
btnUpload.onclick = () => { fileInput.click(); };
fileInput.onchange = () => {
    if (fileInput.files.length !== 2) { alert("Vui lòng chọn 2 hình!"); return; }
    const loadImg = (reader, target) => {
        reader.onload = () => {
            target.src = reader.result; target.style.display = 'block';
            target.style.left = '0%'; target.style.top = '0%'; target.style.transform = 'scale(1)';
            target.classList.add('decor-draggable');
        };
    };
    const r1_read = new FileReader(); loadImg(r1_read, r1); r1_read.readAsDataURL(fileInput.files[0]);
    const r2_read = new FileReader(); loadImg(r2_read, r2); r2_read.readAsDataURL(fileInput.files[1]);
    step = 3; updateButtons();
};

// 5. Cập nhật nút & Tải về
function updateButtons() {
    btnRe.style.opacity = (step > 1) ? '1' : '0.3';
    btnRe.style.pointerEvents = (step > 1) ? 'auto' : 'none';
    btnDown.style.opacity = (step > 2) ? '1' : '0.3';
    btnDown.style.pointerEvents = (step > 2) ? 'auto' : 'none';
}

btnRe.onclick = () => {
    if (step === 2) { step = 1; r1.style.display = 'none'; } 
    else if (step === 3) { step = 2; r2.style.display = 'none'; }
    fileInput.value = ''; updateButtons();
};

btnDown.onclick = () => {
    const booth = document.getElementById('booth-container');
    html2canvas(booth, { scale: 3, useCORS: true, backgroundColor: null }).then(cv => {
        const link = document.createElement('a');
        link.download = 'nguoiVietNamdethuong_yuth.i.jpg';
        link.href = cv.toDataURL('image/jpeg', 0.95);
        link.click();
    });
};

// 6. Sticker & Background
function setFood(n, b) { 
    document.querySelectorAll('[id^="food-"]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.item-l-bunbo, .item-l-bunrieu, .item-l-bundau, .item-l-pho, .item-l-caphe').forEach(e => e.classList.remove('active-item'));
    const el = document.getElementById(`food-${n}`); if(el) el.style.display = 'block'; b.classList.add('active-item');
}
function setText(n, b) {
    document.querySelectorAll('[id^="text-"]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.item-l-iubo, .item-l-iurieu, .item-l-iubundau, .item-l-iupho, .item-l-iucaphe').forEach(e => e.classList.remove('active-item'));
    const el = document.getElementById(`text-${n}`); if(el) el.style.display = 'block'; b.classList.add('active-item');
}
function changeBg(s, b) {
    mainBg.src = s; document.querySelectorAll('[class*="item-l-nen"]').forEach(e => e.classList.remove('active-item')); b.classList.add('active-item');
}

const decorList = ['ghe', 'tuidicho', 'caosaovang', 'deplao', 'nonla', 'cotdien'];
function checkDraggableState() { decorList.forEach(id => { document.getElementById(`decor-${id}`).classList.add('decor-draggable'); }); }
checkDraggableState();

function toggleDecor(n, b) {
    const el = document.getElementById(`decor-${n}`);
    el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
    b.classList.toggle('active-item'); b.classList.toggle('inactive-item');
}

// 7. ZOOM & DRAG
const boothArea = document.getElementById('booth-container');
let isD = false, curEl = null, iX, iY, sX, sY, iDist, iScale;

boothArea.addEventListener('wheel', (e) => {
    if (!e.target.classList.contains('decor-draggable')) return;
    e.preventDefault();
    let sc = parseFloat(e.target.getAttribute('data-scale')) || 1;
    sc += e.deltaY * -0.002; sc = Math.min(Math.max(0.2, sc), 5);
    e.target.setAttribute('data-scale', sc); e.target.style.transform = `scale(${sc})`;
}, {passive: false});

boothArea.addEventListener('mousedown', dS);
boothArea.addEventListener('touchstart', dS, {passive: false});

function dS(e) {
    if (!e.target.classList.contains('decor-draggable')) return;
    isD = true; curEl = e.target;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    iX = curEl.offsetLeft; iY = curEl.offsetTop; sX = cX; sY = cY;
    document.addEventListener('mousemove', dM);
    document.addEventListener('touchmove', dM, {passive: false});
    document.addEventListener('mouseup', dE); document.addEventListener('touchend', dE);
}

function dM(e) {
    if (!curEl) return;
    if(e.type === 'touchmove' && e.touches.length === 2) {
        e.preventDefault();
        let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (!iDist) { iDist = dist; iScale = parseFloat(curEl.getAttribute('data-scale')) || 1; }
        else {
            let sc = Math.min(Math.max(0.2, iScale * (dist / iDist)), 5);
            curEl.setAttribute('data-scale', sc); curEl.style.transform = `scale(${sc})`;
        }
        return;
    }
    if(!isD) return;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let pR = curEl.parentElement.getBoundingClientRect();
    curEl.style.left = (((iX + (cX - sX)) / pR.width) * 100) + '%';
    curEl.style.top = (((iY + (cY - sY)) / pR.height) * 100) + '%';
}
function dE() { isD = false; iDist = null; curEl = null; }
