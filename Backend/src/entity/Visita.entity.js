"use strict";
import { EntitySchema } from "typeorm";

export const Visita = new EntitySchema({
    name: "Visita",
    tableName: "visita",
    columns: {
        id_visita: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_usuario: {
            type: "uuid",
            nullable: false,
        },
        id_exhibicion: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        fecha_visita: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
        duracion_segundos: {
            type: "int",
            nullable: true,
            default: null,
        },
        puntaje_quiz: {
            type: "int",
            nullable: true,
            default: null,
        },
        respuestas_quiz: {
            type: "jsonb",
            nullable: true,
            default: null,
            comment: "Array de objetos con {id_pregunta, id_respuesta_seleccionada, es_correcta, texto_pregunta}"
        },
        quiz_iniciado: {
            type: "boolean",
            nullable: true,
            default: null,
            comment: "Indica si el usuario abrio el quiz (true=inicio, false=abandono, null=no inicio)"
        },
    },
    relations: {
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
        exhibicion: {
            type: "many-to-one",
            target: "Exhibicion",
            joinColumn: { name: "id_exhibicion" },
            onDelete: "CASCADE",
        },
    },
});
