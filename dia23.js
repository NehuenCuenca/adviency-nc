
const formAgregarRegalo = document.querySelector('form#agregar-regalo');
const listaRegalos = document.querySelector('ul#lista-regalos');
const listaRegalosPrevisualizacion = document.querySelector('ul#lista-regalos-previsualizacion');
const botonera = document.querySelector('#botonera');


let regalos = JSON.parse(localStorage.getItem('regalos')) || [];
const regalosAleatorios = ['Un par de medias 🧦', 'Una gorra 🧢', 'Una pala 🥵', 'Un cursito de udemy 🎓'];
let costoTotal = 0;
let regaloAEditar = {};


document.addEventListener('DOMContentLoaded', async() => {
    configurarMusica();
    registrarEventListeners();

    checkearStorage();
    imprimirRegalos( regalos );
    imprimirCostoTotal();
    checkearCartel();
    // const regalosAPI = await traerRegalos();
    // console.log(regalosAPI);
})

const registrarEventListeners = () => { 
    registrarFormAgregarRegalo();
    registrarBotonera();
    // registrarBtnCerrarListaPrevisualizar();
    registrarBtnCerrarForm();
}

const registrarFormAgregarRegalo = () => { 
    formAgregarRegalo.addEventListener('submit', async(e) => {
        e.preventDefault();

        const inputNuevoRegalo = e.target.querySelector('input#nuevo-regalo');
        const inputDestinatarioRegalo = e.target.querySelector('input#destinatario-regalo');
        const inputCantidadRegalo = e.target.querySelector('input#cantidad-regalo');
        const inputPrecioRegalo = e.target.querySelector('input#precio-regalo');
        const inputUrlImagenRegalo = e.target.querySelector('input#img-regalo');

        const regaloTemporal = {
            texto: String(inputNuevoRegalo.value).toLowerCase().trim(),
            destinatario: String(inputDestinatarioRegalo.value).toLowerCase().trim(),
            cantidad: Number(inputCantidadRegalo.value) || 1,
            precio: Number( inputPrecioRegalo.value * inputCantidadRegalo.value),
            urlImagen: await manejarImagenRegalo( String(inputUrlImagenRegalo.value).trim() ),
        }

        const validacion = validarRegalo(regaloTemporal);
        if( !manejarValidacion(validacion) ){ return; }

        const accionForm = formAgregarRegalo.name;
        if( accionForm === 'agregar-regalo' ){
            // if( !yaExisteRegalo(regaloTemporal) ){ guardarRegalo(regaloTemporal); }
            guardarRegalo(regaloTemporal);
        } else if( accionForm === 'editar-regalo') {
            actualizarRegalo(regaloAEditar, regaloTemporal);
        }

        formAgregarRegalo.reset();
        toggleFormAgregarRegalo();
    }); 

    formAgregarRegalo.querySelector('button.btn.btn-aleatorio').addEventListener('click', generarRegaloRandom);
}

const registrarBotonera = () => { 
    botonera.querySelector('#agregar-regalo').addEventListener('click', () => {
        formAgregarRegalo.name = 'agregar-regalo';
        toggleFormAgregarRegalo();
    });

    botonera.querySelector('#previsualizar-regalos').addEventListener('click', () => {
        toggleBtnsAcciones();
        /* console.log('abrir modal previsualizar');
        toggleListaRegalosPrevisualizacion();
        console.log('imprimir los regalos sin los botones');
        imprimirRegalosPrevisualizacion(); */
    });
    
    botonera.querySelector('#imprimir-regalos').addEventListener('click', imprimirListaRegalos);

    botonera.querySelector('#borrar-todos').addEventListener('click', () => {
        if( hayRegalos() ){
            vaciarListaRegalos();
            return checkearCartel();
        }
        alert('¡La lista ya esta vacia!')
    });

    botonera.querySelector('#borrar-storage').addEventListener('click', borrarLocalStorage);
}

const registrarBtnCerrarForm = () => { 
    formAgregarRegalo.querySelector('button.btn.btn-cerrar').addEventListener('click', toggleFormAgregarRegalo);
}

const guardarRegalo = (objRegalo) => { 
    objRegalo['id'] = Date.now();
    
    imprimirRegalo(objRegalo);
    regalos = [ ...regalos, objRegalo ];

    actualizarStorage();
    imprimirCostoTotal();
    checkearCartel();
}

const imprimirRegalo = (objRegalo) => { 
    const { id, texto, destinatario, cantidad, precio, urlImagen } = objRegalo;

    listaRegalos.innerHTML += `
        <li class="regalo" id="${id}" data-regalo="${id}">
            <a href="${urlImagen}" target="_blank" tabindex="-1"> <img src="${urlImagen}" alt="foto del regalo"> </a>
            <span>🎁: ${texto}  <br>${cantidad} unidad/es -> Total: ${precio}<br> 👤: ${destinatario}</span>
            <div class="acciones">
                <button type="button" class="btn" onClick="duplicarRegalo(${id})" tabindex="0">x2</button>
                <button type="button" class="btn" onClick="editarRegalo(${id})" tabindex="0">✍🏽</button>
                <button type="button" class="btn" onClick="borrarRegalo(${id})" tabindex="0">❌</button>
            </div>
        </li>`;   
}

const borrarRegalo = (id) => { 
    // if( confirm('¿Esta seguro de borrar este regalo?')){
        const regaloABorrar = listaRegalos.querySelector(`li[id="${id}"]`);   
        listaRegalos.removeChild(regaloABorrar);
        
        regalos = regalos.filter( (regalo) => regalo.id !== id );
        actualizarStorage();
        imprimirCostoTotal();
        checkearCartel();
    // }
}

const vaciarListaRegalos = () => { 
    while(listaRegalos.firstChild){
        listaRegalos.removeChild(listaRegalos.firstChild);
    }   

    regalos = [];
    actualizarStorage();
    imprimirCostoTotal();
}

const colocarCartelListaRegalos = ( msj='msj vacio' ) => { 
    listaRegalos.innerHTML += `<li class="cartel-msj">
        <p>${msj}</p>
    </li>`;   
}

const quitarCartelListaRegalos = () => { 
    const cartelMsj = listaRegalos.querySelector('li.cartel-msj');
    if( cartelMsj ) { cartelMsj.remove(); }
}

const hayRegalos = () => Array.from(listaRegalos.querySelectorAll('li.regalo')).length > 0;

const checkearCartel = () => { 
    if( !hayRegalos() ){
        return colocarCartelListaRegalos('!No hay regalos por ahora!');
    }

    quitarCartelListaRegalos();
}

const validarRegalo = (objRegalo) => { 
    const objValidacion = {
        check: false,
        msj: ''
    }   
    const estaVacio = objRegalo.texto.length === 0;
    const cantidadNula = objRegalo.cantidad < 1;


    if( estaVacio || cantidadNula ){
        objValidacion['check'] = true;
        objValidacion['msj'] = '🙁OPA, QUE ROMPIMOS🙁';
    }
    
    if( estaVacio ){
        objValidacion['msj'] += '\n - No podes ingresar un regalo vacio, escribí algo papi';
    }
    if( cantidadNula ){
        objValidacion['msj'] += '\n - No podes ingresar esa cantidad, no seas vivo';
    }

    return objValidacion
}

const manejarValidacion = (objValidacion) => { 
    const { check, msj } = objValidacion;
    
    if( check) {
        alert(`${msj}`);
        return false
    }

    return true;
}

const yaExisteRegalo = (objRegalo) => { 
    const yaExiste = regalos.find( ({texto}) => texto === objRegalo.texto );
    
    if( yaExiste ){
        actualizarRegalo(yaExiste, objRegalo);
        return true;
    }else {
        return false;
    }
}

const actualizarRegalo = (viejo, nuevo) => { 
    const { id } = viejo;
    const indexRegalo = regalos.findIndex( regalo => regalo.id === id);
    regalos[indexRegalo] = { id, ...nuevo}; 
    actualizarStorage();
    imprimirCostoTotal();
    //Actualizo el DOM
    const { texto, destinatario, cantidad, precio } = regalos[indexRegalo];
    const liRegalo = listaRegalos.querySelector(`li.regalo[id="${id}"]`);
    liRegalo.querySelector('span').innerHTML = `🎁: ${texto}  <br>${cantidad} unidad/es -> Total: ${precio}<br> 👤: ${destinatario}`;
}

const checkearStorage = () => { 
    if( regalos.length === 0 ){
        localStorage.setItem('regalos', JSON.stringify(regalos));
    }   
}

const imprimirRegalos = (regalos) => { 
    regalos.forEach( (regalo) => {
        imprimirRegalo(regalo);
    });   
}

const actualizarStorage = () => { localStorage.setItem('regalos', JSON.stringify(regalos)); }
const borrarLocalStorage = () => { localStorage.clear(); }


// A PARTIR DEL DIA 10, EMPIEZO A COPIAR PORQUE SINO SE HACE RE LUNGA

const toggleListaRegalosPrevisualizacion = () => { 
    const modal = listaRegalosPrevisualizacion.parentElement.parentElement;
    if( modal.hasAttribute('style') ){
        modal.removeAttribute('style');
        console.log('visible');
    } else {
        limpiarListaRegalosPrevisualizacion();
        modal.style = 'display: none';
        console.log('oculto');
    } 
}

const toggleFormAgregarRegalo = () => { 
    if( formAgregarRegalo.parentElement.hasAttribute('style') ){
        formAgregarRegalo.parentElement.removeAttribute('style');
        formAgregarRegalo.querySelector('input').focus();
        console.log('visible');
    } else {
        formAgregarRegalo.reset();
        formAgregarRegalo.removeAttribute('name');
        formAgregarRegalo.parentElement.style = 'display: none';
        console.log('oculto');
    }   
}

const manejarImagenRegalo = async(url) => { 
    try {
        const { status } = await fetch(url)
        if( url === '' || status === 404){
            return '../14/assets/cono-placeholder.jpg';
        }

        return url;
    } catch (error) {
        return '../14/assets/cono-placeholder.jpg';
    }
}

const editarRegalo = (id) => { 
    formAgregarRegalo.name = 'editar-regalo';
    toggleFormAgregarRegalo();   
    const regaloClickeado = regalos.find( regalo => regalo.id === id );
    cargarInputsForm(regaloClickeado);
    regaloAEditar = {...regaloClickeado};
}

const cargarInputsForm = (objRegalo) => { 
    const llaves = Object.keys(objRegalo);

    llaves.forEach( llave => {
        const input = formAgregarRegalo.querySelector(`input[name="${llave}"`);
        if( input ) {
            input.value = objRegalo[llave];
        }
    });
    const { precio, cantidad } = objRegalo;

    formAgregarRegalo.querySelector(`input[name="precio"]`).value = Number( precio/cantidad );
}

const traerRegalos = async() => { 
    const UrlApiRegalos = './datasbase/regalos.json';
    try {
        resp = await fetch( UrlApiRegalos );
        return await resp.json();
    } catch (error) {
        console.error(`Error al traer regalos de la API:\n ${error}`);
    }
}

const generarRegaloRandom = () => { 
    const indexAleatorio = Math.floor( Math.random() * regalosAleatorios.length );
    formAgregarRegalo.querySelector('input#nuevo-regalo').value = `${regalosAleatorios[indexAleatorio]}`;
}

const calcularCostoTotal = () => { 
    costoTotal = regalos.reduce( (acum, regalo) => {
        acum += regalo.precio;
        return acum;
    }, 0 );
    return costoTotal;
}

const imprimirCostoTotal = () => { 
    const tituloCostoTotal = document.querySelector('#costo-total');
    tituloCostoTotal.textContent = `Total: $${calcularCostoTotal()}`;
}

const duplicarRegalo = (id) => { 
    formAgregarRegalo.name = 'agregar-regalo';
    toggleFormAgregarRegalo();   
    const regaloClickeado = regalos.find( regalo => regalo.id === id );
    cargarInputsForm(regaloClickeado);
    
    const inputDestinatarioRegalo = formAgregarRegalo.querySelector('input[name="destinatario"]');
    inputDestinatarioRegalo.value = '';
    inputDestinatarioRegalo.focus();
}

/* const imprimirRegaloPrevisualizacion = ( objRegalo ) => { 
    const { id, texto, destinatario, cantidad, precio, urlImagen } = objRegalo;

    listaRegalosPrevisualizacion.innerHTML += `
        <li class="regalo" id="${id}" data-regalo="${id}">
            <a href="${urlImagen}" target="_blank" tabindex="-1"> <img src="${urlImagen}" alt="foto del regalo"> </a>
            <span>🎁: ${texto} <br> 👤: ${destinatario} <br> 💲: ${precio} <br>  ${cantidad} unidad/es</span>
        </li>`;
}

const imprimirRegalosPrevisualizacion = () => { 
    regalos.forEach( (regalo) => imprimirRegaloPrevisualizacion(regalo) );
}

const limpiarListaRegalosPrevisualizacion = () => { 
    while( listaRegalosPrevisualizacion.firstChild ){
        listaRegalosPrevisualizacion.removeChild( listaRegalosPrevisualizacion.firstChild );
    }   
}

const registrarBtnCerrarListaPrevisualizar = () => { 
    const container = listaRegalosPrevisualizacion.parentElement;
    container.querySelector('button.btn.btn-cerrar').addEventListener('click', toggleListaRegalosPrevisualizacion);
}
 */
const imprimirListaRegalos = () => { 
    const btns = Array.from(listaRegalos.querySelectorAll('.acciones'));   
    const estanOcultos = btns[0].hasAttribute('style');
    do {
        toggleBtnsAcciones();
    } while( estanOcultos );

    window.print();
    toggleBtnsAcciones();
}

const toggleBtnsAcciones = () => { 
    const btns = Array.from(listaRegalos.querySelectorAll('.acciones'));   
    const estanOcultos = btns[0].hasAttribute('style');

    if( !estanOcultos ){
        btns.forEach( container => {
            container.setAttribute('style', 'display:none;');
        });
    } else {
        btns.forEach( container => {
            container.removeAttribute('style');
        });
    }
}

const configurarMusica = () => { 
    const audio = document.querySelector("audio");
    audio.volume = 0.2;
    // audio.play();
}
