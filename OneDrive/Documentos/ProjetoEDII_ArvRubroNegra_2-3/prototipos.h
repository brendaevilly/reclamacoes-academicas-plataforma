
#ifndef PROTOTIPOS_H
#define PROTOTIPOS_H

#include <stdio.h>
#include <stdlib.h>

typedef enum{VERMELHO,PRETO}Cor;

typedef struct Musica{
    char titulo[50];
    int qntMinutos;
    Musica *prox; 
}Musica;

typedef struct Albuns{
    char titulo[50];
    int anoLancamento;
    int qntMusicas;
    Musica *listMusic; 
}Albuns;


typedef struct Artista{
    char nome[50];
    char estiloMusical[50];
    int numAlbuns;
    Albuns *albuns; 
}Artista;

typedef struct Dados{
    Albuns Albuns;
    Artista Artista;
}Dados; 

typedef struct Arvore{
    Dados info; 
    int flag; 
    Cor cor;
    Arvore *dir, *esq;
}Arvore;


//FUNÇÕES DE ARVORE
void cadastrarArvore();
void removerNoArvore(); 
void buscarNoPorNome();

//FUNÇÕES DE LISTA 
void cadastrarMusica();
void removerMusica(); 
void buscarMusica();

#endif