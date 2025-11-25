import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, stats, clock, gui, mixer, actions, activeAction, previousAction;
let camera, scene, renderer, model, face, model_1, mixer_def_1, mixer_def_2, model_2;

// STATO INIZIALE DEL PERSONAGGIO
const api = { state: 'idle' };

init();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // DICHIARAZIONE CAMERA

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( - 5, 3, 10 );
    camera.lookAt( 0, 2, 0 );

    // DICHIARAZIONE SCENA
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xe0e0e0 );
    scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

    clock = new THREE.Clock();

    // DICHIARAZIONE LUCI

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.position.set( 0, 20, 10 );
    scene.add( dirLight );

    // DICHIARAZIONE SUOLO

    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load(
        "/grass.jpg",
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping; 
            texture.repeat.set(15, 15);
        }   
    );
    const planeGeometry = new THREE.PlaneGeometry(100,100);
    const planeMaterial = new THREE.MeshLambertMaterial({
        map: grassTexture
    })

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial );
    mesh.rotation.x = - Math.PI / 2;
    scene.add( mesh );

    const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    // IMPORTAZIONE MODELLO

    const loader = new GLTFLoader();
    loader.load( '/lego.glb', function ( gltf ) {
        model = gltf.scene;
        model.scale.set(10000, 10000, 10000);
        scene.add( model );
        // CREAZIONE DI UNA GUI
        createGUI( model, gltf.animations );
        }, undefined, function ( e ) {
        console.error( e );
    } );


    const loader_1 = new GLTFLoader();
    loader_1.load( '/lego.glb', function ( gltf ) {
        model_1 = gltf.scene;
        model_1.scale.set(10000, 10000, 10000);
        model_1.position.set(10,0,0);
        scene.add( model_1);
        // ASSEGNARE UN'ANIMAZIONE DEFAULT
        mixer_def_1 = new THREE.AnimationMixer( model_1 );
        playAnimationDefault(model_1, gltf.animations, mixer_def_1);
        
        }, undefined, function ( e ) {
        console.error( e );
    } );

    const loader_2 = new GLTFLoader();
    loader_2.load( '/lego.glb', function ( gltf ) {
        model_2 = gltf.scene;
        model_2.scale.set(10000, 10000, 10000);
        model_2.position.set(5,0,0);
        scene.add( model_2);
        mixer_def_2 = new THREE.AnimationMixer( model_2 );
        // ASSEGNARE UN'ANIMAZIONE DEFAULT
        playAnimationDefault(model_2, gltf.animations, mixer_def_2);
        
        }, undefined, function ( e ) {
        console.error( e );
    } );

    // DICHIARAZIONE RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    // AGGIUNGERE IL RIDIMENSIONAMENTO DELL'IMMAGINE
    window.addEventListener( 'resize', onWindowResize );

    // CONTROLLI PER RUOTARE LA SCENA
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 15;
    orbitControls.enablePan = false;
    orbitControls.maxPolarAngle = Math.PI / 2 -0.05;
    orbitControls.update();

    // STATS on FRAMES
    stats = new Stats();
    container.appendChild( stats.dom );

}

function playAnimationDefault(model, animations, mixer_def){
    const states = [ 'idle', 'defeated_1', 'taunt' ]; //QUESTE CAMBIANO SE IL PERSONAGGIO CAMBIA

    let actions_def = {};
    console.log(animations)
    for ( let i = 0; i < animations.length; i ++ ) {

        const clip = animations[ i ]; // ogni animazione
        const action = mixer_def.clipAction( clip ); // azione dell'animazione
        actions_def[ clip.name ] = action;
        // controlla se è uno stato o un'animazione
        if ( states.indexOf( clip.name ) >= 4 ) {

            action.clampWhenFinished = true; // l'animazione si stoppa al suo ultimo frame se è vero
            action.loop = THREE.LoopOnce; // ripetilo solo una volta
        }

    }

    let activeAction_def = actions_def[ 'taunt' ];
    activeAction_def.play();

}

function createGUI( model, animations ) {

    const states = [ 'idle', 'defeated_1', 'taunt' ];
    
    gui = new GUI();

    mixer = new THREE.AnimationMixer( model );

    actions = {};
    console.log(animations)
    for ( let i = 0; i < animations.length; i ++ ) {

        const clip = animations[ i ]; // ogni animazione
        const action = mixer.clipAction( clip ); // azione dell'animazione
        actions[ clip.name ] = action;
        // controlla se è uno stato o un'animazione
        if ( states.indexOf( clip.name ) >= 4 ) {

            action.clampWhenFinished = true; // l'animazione si stoppa al suo ultimo frame se è vero
            action.loop = THREE.LoopOnce; // ripetilo solo una volta
        }

    }

    // states

    const statesFolder = gui.addFolder( 'States' ); // visualizziamo la tendina dello state
    const clipCtrl = statesFolder.add( api, 'state' ).options( states ); // visualizziamo lo stato di default
    // visualizziamo il dropdown
    clipCtrl.onChange( function () {

        fadeToAction( api.state, 0.5 ); // funzione che ci permette di passare da un'animazione a un'altra facendo visualizzare sulla GUI l'azione attiva e quelle disattivate

    } );

    statesFolder.open(); // di default è aperta


    activeAction = actions[ 'idle' ];
    activeAction.play();

}

function fadeToAction( name, duration ) {

    previousAction = activeAction;
    activeAction = actions[ name ];

    if ( previousAction !== activeAction ) {

        previousAction.fadeOut( duration );

    }

    activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    const dt = clock.getDelta();

    if ( mixer ) mixer.update( dt );
    if ( mixer_def_1 ) mixer_def_1.update( dt );

    if ( mixer_def_2 ) mixer_def_2.update( dt );

    renderer.render( scene, camera );

    stats.update();

}