# Lujuria y Gula

Diseño aprobado mediante grilling; tickets en `.scratch/infernal-circles/issues/`.

## Mapas y dificultad

Los cuatro escenarios están disponibles para pruebas sin desbloqueos. Lujuria usa ruinas en rosa viejo y rojo apagado, almas veloces y sirenas que mantienen distancia y disparan. Gula usa barro verde/gris, glotones resistentes y bestias que dejan charcos al morir. Ambos conservan criptas, cofres, altar y controles actuales.

La vida al aparecer es `ceil(vida del tipo y élite × factor del mapa × (1 + 0.08 × minutos + 0.01 × (nivel - 1)))`. Factores: Bosque 1, Limbo 1.25, Lujuria 1.5, Gula 1.8. El tiempo es continuo y solo avanza jugando. Un zombi de 25HP en Bosque al minuto 5 y nivel 10 aparece con 38HP. Los enemigos vivos no se actualizan al subir de nivel. La curva no aumenta daño ni velocidad. Hordas e invocaciones comparten el límite de 250.

## Eventos

En superficie, desde el minuto 1 hay eventos de 8–12s con aviso de 2s; los inicios se separan 35–50s. En Lujuria, ráfagas locales empujan respetando obstáculos. En Gula, la lluvia forma charcos señalizados: reducen movimiento normal al 60%, sin bloquear la esquiva. Los charcos de lluvia duran 30s activos y los de criaturas 20s. Cualquier peligro caduca a más de 1400px de todos los héroes o al terminar su duración, con un máximo de 24 zonas. La lluvia dibuja 48 trazos, sin acumular partículas.

Pausa y segundo plano detienen los relojes. Entrar/salir de una cripta y comenzar una partida limpian peligros; las criptas no tienen clima. Al despertar al boss se limpia el evento actual y sus ataques pasan a controlar los peligros.

## Guardianes y orientación

El altar despierta al Señor de la Tempestad o a Cerbero. Vida fijada al activarse, con curva más suave: factor del mapa × (1 + 0.04 × minutos + 0.005 × (nivel - 1)), conservando el factor de grupo existente. Cambian de fase al 65% y al 30%.

La Tempestad combina ráfagas, tornados y proyectiles con espacios seguros. Cerbero muestra tres cabezas y combina mordidas escalonadas, embestida señalizada y charcos helados. Las criptas quedan cerradas mientras el guardián está activo para mantener el combate en su superficie.

Desde 02:00 el minimapa muestra una flecha amarilla al altar, incluso si queda fuera de sus bordes. En las criptas no muestra esa guía; al despertar al boss indica que está activo. La victoria termina la partida de inmediato y registra el premio una sola vez.

Almas y XP de enemigos usan los multiplicadores actuales: 1/1.25/1.5/1.8, redondeados. El premio del boss es 100/125/150/180 almas. Nuevas habilidades, objetos y sistemas de recompensas persistentes quedan fuera de esta entrega.

## Arte local

Los cuatro PNG de `public/assets/circles/` son generaciones Genex locales, incluidas en el APK. IDs de procedencia: `cmvhh803z00sh3fn3x50upqjl` (Cerbero), `cmvhh8b3p00sq3fn3qcippuq8` (Tempestad), `cmvhh8e7a00ql2xmrxopyv06q` (Lujuria), `cmvhh8h6400qt2xmragr2xbfz` (Gula). Los enemigos reutilizan variantes coloreadas de los sprites PixelLab existentes. No se descargan imágenes desde servicios externos durante el juego.

## Comprobar en el Moto G75

Instalar la nueva APK conservando los datos, elegir cada mapa y acercarse al altar; probar sus tres fases y la victoria. Sobrevivir más de dos minutos para comprobar eventos, charcos residuales y flecha. Probar esquiva dentro de un charco, pausa durante un evento, entrar/salir de criptas y cambiar de aplicación. Revisar fluidez y legibilidad con muchas criaturas: el emulador no establece el rendimiento del teléfono real.
