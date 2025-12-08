"use strict";
import { EntitySchema } from "typeorm";

export const Responde = new EntitySchema({
    name: "Responde",
    tableName: "responde",
    columns: {
        id_responde: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_usuario: {
            type: "uuid",
            nullable: false,
        },
        id_quizz: {
            type: "int",
            nullable: false,
        },
        correctas: {
            type: "int",
            nullable: false,
            default: 0,
        },
        tiempo_segundos: {
            type: "int",
            nullable: true,
            default: null,
        },
        respuestas_detalle: {
            type: "jsonb",
            nullable: true,
            default: null,
            comment: "Array de objetos con {id_pregunta, id_respuesta_seleccionada, es_correcta, texto_pregunta, texto_respuesta}"
        },
        fecha_responde: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
    },
    relations: {
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
        quizz: {
            type: "many-to-one",
            target: "Quizz",
            joinColumn: { name: "id_quizz" },
            onDelete: "CASCADE",
        },
    },
});
