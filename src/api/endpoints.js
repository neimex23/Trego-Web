export const ENDPOINTS = {
  // Restaurantes (cliente)
  RESTAURANTES: '/api/restaurantes',
  RESTAURANTES_TODOS: '/api/restaurantes/listar',
  RESTAURANTES_ZONA: '/api/restaurantes/listarXdirreccion', // falta endpoint backend
  RESTAURANTE_POR_ID: '/api/restaurantes/obtenerRestaurante/:id',
  COMENTARIOS_AGREGAR: '/api/restaurantes/comentarios/agregar',
  COMENTARIOS_LISTAR: '/api/restaurantes/comentarios/listar',
  COMENTARIOS_YA_COMENTE: '/api/restaurantes/comentarios/yaComente',
  CALIFICACION_OBTENER: '/api/restaurantes/calificacion/obtener/:id',

  // Menú y pedidos
  MENU_RESTAURANTE: '/api/pedido/restaurante/:id/verMenu',
  PEDIDO_CONFIRMAR: '/api/pedido/confirmar',
  PEDIDO_MIS_PEDIDOS: '/api/pedido/misPedidos',

  // Reclamos
  RECLAMOS: '/api/reclamos',

  // Carrito
  CARRITO: '/api/carrito',
  CARRITO_PRODUCTOS: '/api/carrito/productos',
  CARRITO_ITEMS: '/api/carrito/items',

  // Pagos
  PAGO_ESTADO: '/api/pagos/estado/:idPedido',

  // Geocoding
  GEO_REVERSE: '/api/geo/reverse',

  // Usuarios
  USUARIO_DIRECCIONES: '/api/usuarios/obtenerDirecciones',
  USUARIO_GUARDAR_DIRECCION: '/api/usuarios/guardarDireccion', // falta endpoint backend
  USUARIO_ACTUAL: '/api/usuarios/actual',
  USUARIO_RECUPERAR_CONTRASENA: '/api/usuarios/recuperarContraseña',
  USUARIO_ACTUALIZAR_CONTRASENA: '/api/usuarios/actualizarContraseña',
  USUARIO_PERFIL: '/api/usuarios/perfil',
  USUARIO_AGREGAR_DIRECCION: "/api/usuarios/agregarDireccion",
  USUARIO_ACTUALIZAR_DIRECCION:"/api/usuarios/actualizarDireccion",
  CLIENTE_MODIFICAR_PERFIL: "/api/clientes/actualizar",
  CLIENTE_ACTUAL: "/api/clientes/actual",
  RESTAURANTE_MODIFICAR_PERFIL: "/api/restaurantes/actualizar",

  // Auth
  AUTH_GOOGLE: '/api/auth/google',
  AUTH_SMS: '/api/auth/sms',
  AUTH_LOGIN_ADMIN: '/api/auth/login/admin',
  AUTH_ADMIN_VERIFICAR_OTP: '/api/auth/admin/verificar-otp', // falta endpoint backend
  AUTH_CERRAR_SESION: '/api/auth/cerrarSesion',
  AUTH_REGISTRO: '/api/auth/registro',
  AUTH_VINCULAR: '/api/auth/vincular',

  // Restaurante — alta de local (formulario completo)
  SOLICITUD_ALTA_RESTAURANTE: '/api/restaurantes/altaRestaurante',
  FIRMA_IMAGEN: `/api/usuarios/imagen/firma`,
  OBTENER_RESTAURANTE_ACTUAL: `/api/restaurantes/actual`,
  AGREGAR_PRODUCTO: "/api/productos/agregarProducto",
  LISTAR_INGREDIENTES: "/api/productos/listarIngredientes",
  AGREGAR_INGREDIENTE: `/api/productos/agregarIngrediente`,
  LISTAR_PRODUCTOS: '/api/productos/listarProductos',
  MODIFICAR_PRODUCTO: '/api/productos/modificarProducto',
  DESHABILITAR_PRODUCTO: '/api/productos',
  LISTAR_PEDIDOS: `/api/pedido/listarPedidos`,
  LISTAR_SUBCATEGORIAS: `/api/subcategorias/listar`,
  LISTAR_PRODUCTOS_OFERTA: '/api/productos/listarProductosOferta',
  CONFIRMAR_PEDIDO: `/api/pedido/confirmar`,
  ACTUALIZAR_ESTADO: `/api/pedido/estado`,
  CANCELAR_PEDIDO: `/api/pedido/reembolsar`,
  ABRIR_LOCAL: `/api/restaurantes/abrirLocal`,
  CERRAR_LOCAL: `/api/restaurantes/cerrarLocal`,
  ACTUALIZAR_CIERRE: `/api/restaurantes/actualizarCierre`,
  ACTUALIZAR_CIERRE_PROGRAMADO: `/api/restaurantes/actualizarCierreProgramado`,
  CREAR_OFERTA: "/api/restaurantes/ofertas/crear",
  RESTAURANTE_ESTADISTICAS: "/api/restaurantes/estadisticas",
  ACTIVAR_DESACTIVAR_OFERTA: "/api/restaurantes/ofertas/desactivar",

  //Registro
  REGISTRAR_RESTAURANTE: `/api/usuarios/registrar-restaurante/solicitar`,
  CONFIRMAR_REGISTRO: `/api/usuarios/registrar-restaurante/confirmar`,
  REENVIAR_CODIGO: `/api/usuarios/registrar-restaurante/reenviar-codigo`,

  // Administrador — gestión de altas de restaurantes
  ADMIN_RESTAURANTES_LISTA: '/api/administradores/restaurantes/lista',
  ADMIN_RESTAURANTE_HABILITAR: '/api/administradores/restaurantes/:id/habilitar',
  ADMIN_RESTAURANTE_NO_HABILITAR: '/api/administradores/restaurantes/:id/noHabilitar/:motivo',

  // Administrador — subcategorías
  SUBCATEGORIA_CREAR: '/api/subcategorias/crear',

  // Administrador — clientes
  CLIENTES_TODOS: '/api/clientes',

  // Administrador — activación / desactivación de cuentas
  ADMIN_USUARIO_HABILITAR_DESHABILITAR:
    '/api/administradores/HabilitarDeshabilitar/:id/:habilitar',

  // Administrador — alta de administradores
  ADMIN_CREAR_ADMINISTRADOR: '/api/administradores/CrearAdministrador',
}
