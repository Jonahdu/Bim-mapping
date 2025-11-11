// 全局变量
let scene, camera, renderer, model;
let axesHelperVisible = true;
let colorMode = 'type'; // 当前颜色模式：'type' 或 'status'

// 构件类型颜色映射配置
const elementTypeColorMap = {
    'Wall': { color: 0xFF6B6B, opacity: 1.0 },
    'StructuralColumn': { color: 0x4ECDC4, opacity: 1.0 },
    'Beam': { color: 0x45B7D1, opacity: 1.0 },
    'Floor': { color: 0x96CEB4, opacity: 1.0 },
    'Door': { color: 0xFFEAA7, opacity: 0.8 },
    'Window': { color: 0xDDA0DD, opacity: 0.7 },
    'Roof': { color: 0xFFA07A, opacity: 1.0 },
    'Stair': { color: 0x9370DB, opacity: 1.0 },
    'Railing': { color: 0x20B2AA, opacity: 0.6 },
    'Furniture': { color: 0xDEB887, opacity: 1.0 },
    'Equipment': { color: 0x708090, opacity: 1.0 },
    'Default': { color: 0xCCCCCC, opacity: 1.0 }
};

// 施工状态颜色配置
const constructionStatusColorMap = {
    'not_started': { color: 0xCCCCCC, opacity: 0.3 },
    'planned': { color: 0x87CEEB, opacity: 0.6 },
    'in_progress': { color: 0xFFA500, opacity: 0.8 },
    'completed': { color: 0x32CD32, opacity: 1.0 },
    'delayed': { color: 0xFF4500, opacity: 1.0 },
    'quality_issue': { color: 0xFFD700, opacity: 1.0 },
    'on_hold': { color: 0x800080, opacity: 0.5 },
    'default': { color: 0xCCCCCC, opacity: 0.3 }
};

// 初始化Three.js场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('viewer3d').appendChild(renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 加载示例模型
    loadSampleModel();

    // 设置事件监听
    setupEventListeners();

    // 开始动画循环
    animate();

    // 窗口调整大小事件
    window.addEventListener('resize', onWindowResize);
}

// 加载示例模型
function loadSampleModel() {
    // 由于我们可能没有现成的模型，这里创建一些测试几何体
    createTestGeometry();
}

// 创建测试几何体
function createTestGeometry() {
    const geometries = [
        { type: 'Wall', geometry: new THREE.BoxGeometry(8, 3, 0.3), position: [0, 1.5, -2] },
        { type: 'Column', geometry: new THREE.CylinderGeometry(0.2, 0.2, 4, 8), position: [-2, 2, 0] },
        { type: 'Beam', geometry: new THREE.BoxGeometry(4, 0.3, 0.3), position: [0, 3, 1] },
        { type: 'Floor', geometry: new THREE.BoxGeometry(6, 0.2, 4), position: [0, 0, 0] },
        { type: 'Door', geometry: new THREE.BoxGeometry(1, 2, 0.1), position: [0, 1, -1.9] },
        { type: 'Window', geometry: new THREE.BoxGeometry(1.5, 1, 0.1), position: [2, 1.5, -1.9] }
    ];

    geometries.forEach((item, index) => {
        const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(item.geometry, material);
        mesh.position.set(...item.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // 为每个网格添加用户数据
        mesh.userData = {
            elementType: item.type,
            constructionStatus: getRandomStatus(),
            elementId: `test-${index}`
        };

        scene.add(mesh);
    });

    // 初始应用颜色映射
    applyColorMapping();
}

// 随机状态生成
function getRandomStatus() {
    const statuses = ['not_started', 'planned', 'in_progress', 'completed', 'delayed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// 应用颜色映射
function applyColorMapping() {
    scene.traverse((child) => {
        if (child.isMesh) {
            let colorConfig;
            if (colorMode === 'type') {
                const elementType = child.userData.elementType || 'Default';
                colorConfig = elementTypeColorMap[elementType] || elementTypeColorMap['Default'];
            } else {
                const status = child.userData.constructionStatus || 'not_started';
                colorConfig = constructionStatusColorMap[status] || constructionStatusColorMap['default'];
            }

            if (child.material) {
                child.material.color.setHex(colorConfig.color);
                child.material.opacity = colorConfig.opacity;
                child.material.transparent = colorConfig.opacity < 1.0;
                child.material.needsUpdate = true;
            }
        }
    });
}

// 设置事件监听
function setupEventListeners() {
    document.getElementById('btnType').addEventListener('click', () => {
        colorMode = 'type';
        applyColorMapping();
    });

    document.getElementById('btnStatus').addEventListener('click', () => {
        colorMode = 'status';
        applyColorMapping();
    });

    document.getElementById('btnUpdateStatus').addEventListener('click', updateSelectedStatus);

    document.getElementById('btnReset').addEventListener('click', resetCamera);

    document.getElementById('btnToggleAxes').addEventListener('click', toggleAxes);

    // 鼠标点击事件（用于选择构件）
    window.addEventListener('click', onMouseClick, false);
}

// 更新选中构件的状态（这里我们假设选中最后一个点击的构件）
let selectedObject = null;

function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        selectedObject = object;
        showObjectInfo(object);
    }
}

function updateSelectedStatus() {
    if (selectedObject) {
        const newStatus = document.getElementById('statusSelect').value;
        selectedObject.userData.constructionStatus = newStatus;
        // 重新应用颜色映射
        applyColorMapping();
        // 更新信息面板
        showObjectInfo(selectedObject);
    } else {
        alert('请先点击选择一个构件！');
    }
}

function showObjectInfo(object) {
    const infoPanel = document.getElementById('infoPanel');
    const userData = object.userData;

    infoPanel.innerHTML = `
        <strong>选中构件信息:</strong><br>
        类型: ${userData.elementType || '未知'}<br>
        状态: ${userData.constructionStatus || '未知'}<br>
        ID: ${userData.elementId || '无'}
    `;
}

function resetCamera() {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
}

function toggleAxes() {
    const axesHelper = scene.getObjectByProperty('type', 'AxesHelper');
    if (axesHelper) {
        axesHelper.visible = !axesHelper.visible;
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// 窗口调整大小
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 启动应用
init();