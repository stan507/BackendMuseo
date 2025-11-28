"use strict";
import { EntitySchema } from "typeorm";

export const Usuario = new EntitySchema({
    name: "Usuario",
    tableName: "usuario",
    columns: {
        id_usuario: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        apellido: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        correo: {
            type: "varchar",
            length: 255,
            nullable: true,
            unique: true,
        },
        contrasena: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        rol: {
            type: "varchar",
            length: 50,
            nullable: false,
        },
    },
});
