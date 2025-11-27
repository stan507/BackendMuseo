"use strict";
import { EntitySchema } from "typeorm";

export const Exhibicion = new EntitySchema({
    name: "Exhibicion", 
    tableName: "exhibicion", 
    columns: {

        id_exhibicion: {
            type: "varchar",
            primary: true,
            length: 100,
            nullable: false,
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        relato_escrito: {
            type: "text",
            nullable: false, 
        },
        
    },
});