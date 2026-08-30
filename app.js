// Importación de la biblioteca principal de Three.js
import * as THREE from 'three';
// Importación del botón de WebXR para habilitar/deshabilitar el modo VR
import { VRButton } from 'three/addons/webxr/VRButton.js';
// Fábrica para cargar y gestionar los modelos visuales de los mandos de VR
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
// Geometría auxiliar para crear un entorno en forma de habitación con líneas (Wireframe Box)
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
// Monitor de rendimiento (Muestra FPS y tiempo de renderizado)
import Stats from 'three/addons/libs/stats.module.js';
// Controles de órbita para navegar por la escena con el ratón en la pantalla 2D
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Clase principal que encapsula toda la aplicación 3D
class App {
	constructor() {
		// Crea un elemento <div> en el DOM y lo adjunta al cuerpo del documento HTML para contener el lienzo 3D
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        // Inicializa un reloj de Three.js para rastrear el tiempo transcurrido (útil para animaciones)
        this.clock = new THREE.Clock();
        
		// Configura la cámara perspectiva: (Campo de visión, Relación de aspecto, Plano cercano, Plano lejano)
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		// Posiciona la cámara a 1.6 metros de altura (promedio de los ojos de una persona) y 3 metros hacia atrás
		this.camera.position.set( 0, 1.6, 3 );
        
		// Crea la escena 3D contenedora de objetos y luces
		this.scene = new THREE.Scene();
        // Establece un fondo de color gris oscuro para la escena
        this.scene.background = new THREE.Color( 0x505050 );

		// Añade una luz hemisférica (luz ambiental suave simulando cielo y suelo con tonos de gris)
		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        // Añade una luz direccional blanca con intensidad de 3 para proyectar luces y sombras directas
        const light = new THREE.DirectionalLight( 0xffffff, 3 );
        // Define la dirección desde donde proviene la luz y la normaliza
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		// Instancia el renderizador WebGL con antialiasing para suavizar los bordes rectos
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		// Ajusta la proporción de píxeles al dispositivo del usuario (para pantallas Retina/HDPI)
		this.renderer.setPixelRatio( window.devicePixelRatio );
		// Ajusta el tamaño del renderizador al ancho y alto de la ventana del navegador
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        // Configura el espacio de color de salida a sRGB para una representación de color correcta
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		// Inserta el elemento Canvas generado por WebGL dentro del contenedor HTML
		container.appendChild( this.renderer.domElement );
        
        // Asigna los controles de órbita a la cámara asociados al lienzo WebGL
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // Establece el punto focal sobre el cual la cámara orbitará (altura de 1.6 metros)
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();
        
        // Inicializa el panel de estadísticas (FPS) y lo añade a la interfaz gráfica
        this.stats = new Stats();
        container.appendChild( this.stats.dom );
        
        // Métodos de inicialización personalizada y configuración de VR (vacíos para implementar)
        this.initScene();
        this.setupXR();
        
        // Escucha el evento de cambio de tamaño de pantalla para reajustar la cámara y el renderizador
        window.addEventListener('resize', this.resize.bind(this) );
        
        // Define el bucle principal de renderizado (requerido para aplicaciones WebXR en lugar de requestAnimationFrame)
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    // Función de utilidad para generar números aleatorios dentro de un rango determinado
    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    // Método destinado a construir y poblar los objetos de la escena
    initScene(){
        // Define una propiedad de la clase para almacenar un radio (por ejemplo, 0.08 metros o 8 cm).
        // Suele utilizarse más adelante para crear objetos esféricos o definir límites de colisión.
        this.radius = 0.08;

        // Crea un objeto 3D formado por segmentos de línea (malla de alambre / wireframe).
        this.room = new THREE.LineSegments(
            // Geometría: Crea un cubo delimitador de 6x6x6 metros dividido en 10 segmentos por lado.
            new BoxLineGeometry(6, 6, 6, 10, 10, 10),
            // Material: Aplica un material básico para líneas de color gris (0x808080).
            new THREE.LineBasicMaterial( { color: 0x808080 } )
        );
    
        // Traslada (mueve) la geometría de la habitación 3 unidades hacia arriba en el eje Y.
        // Esto hace que el suelo del cubo coincida con el origen (Y = 0) en lugar de estar centrado en él.
        this.room.geometry.translate( 0, 3, 0 );
        
        // Agrega el objeto de la habitación a la escena 3D para que sea visible durante el renderizado.
        this.scene.add(this.room);

        // Crea la forma (geometría) de un icosaedro.
        // Parámetros: 
        // 1. Radio (this.radius = 0.08 metros, definido previamente).
        // 2. Detalle/Subdivisiones (2): Al añadir subdivisiones, las caras se dividen 
        // creando una forma casi esférica pero con estilo poligonal (low-poly).
        const geometry = new THREE.IcosahedronGeometry( this.radius, 2 );

        for(let i=0; i<200;i++){
            // Crea una malla 3D (Mesh) combinando la geometría creada con un material visual.
            const object = new THREE.Mesh(
                geometry,
                // Material Lambert: Reacciona a las luces de la escena creando sombreado (sin reflejos especulares/brillantes).
                // Se le asigna un color azul verdoso/azulejo (hexadecimal 0x428FB8).
                new THREE.MeshLambertMaterial( { color: Math.random() * 0xFFFFFF } )
            );

            // Define las coordenadas espaciales del objeto (X = 0, Y = 1, Z = 0).
            // Lo sitúa en el centro horizontal, a 1 metro de altura sobre el suelo.
            object.position.x = this.random( -2, 2 );
            object.position.y = this.random( -2, 2 );
            object.position.z = this.random( -2, 2 );
            // Agrega el objeto como "hijo" del objeto this.room.
            // Al estar emparentado con this.room, si la habitación se mueve o rota, el objeto se 
            // moverá junto con ella.
            this.room.add(object);
        }
    }
    
    // Método destinado a configurar los controladores VR, el botón de entrada WebXR y la compatibilidad con dispositivos
    setupXR(){
        // Activa la compatibilidad de WebXR en el renderizador de Three.js.
        // Esto le indica a Three.js que debe gestionar las cámaras estéreas (una para cada ojo)
        // y coordinar el bucle de renderizado con los cuadros de visualización del visor VR.
        this.renderer.xr.enabled = true;

        // Genera un botón HTML interactivo utilizando el módulo VRButton de Three.js
        // y lo añade directamente al cuerpo (<body>) de la página web.
        // Este botón detecta si el navegador/dispositivo soporta VR (ej. Oculus Quest, Apple Vision Pro, etc.)
        // y muestra estados como "ENTER VR", "VR NOT SUPPORTED" o "VR NOT ALLOWED".
        document.body.appendChild( VRButton.createButton( this.renderer ) );
    }
    
    // Reajusta las dimensiones del canvas y la proyección de la cámara cuando la ventana cambia de tamaño
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	// Bucle de renderizado continuo (se ejecuta en cada cuadro por segundo)
	render( ) {   
        // Actualiza el medidor de FPS en cada cuadro
        this.stats.update();
        
        // Dibuja la escena 3D desde la perspectiva de la cámara activa
        this.renderer.render( this.scene, this.camera );
    }
}
//Ejemplo
// Exporta la clase App para ser utilizada en otros módulos de JavaScript
export { App };