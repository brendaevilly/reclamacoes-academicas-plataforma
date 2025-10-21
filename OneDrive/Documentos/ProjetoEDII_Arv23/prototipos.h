#ifndef PROTOTIPOS_H
#define PROTOTIPOS_H

#include <stdio.h>
#include <stdlib.h>

typedef struct Musica Musica;
typedef struct Albuns Albuns;
typedef struct Artista Artista; 
typedef union Dados Dados;
typedef struct Arvore Arvore;


//typedef enum{VERMELHO,PRETO}Cor;

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
    Arvore *albuns; 
}Artista;

typedef union Dados{
    Albuns Albuns;
    Artista Artista;
}Dados; 

typedef struct Arvore{ 
    int nInfo; 
    int tipo; 
    Dados info1, info2;
    Arvore *dir, *esq,*meio;
}Arvore;

Arvore *criarNoArvore(Dados info, Arvore *esq, Arvore *meio);
int ehFolha(Arvore *raiz);
int adicionaNo(Arvore **raiz, Arvore *no , char *nome );
Arvore *quebrarNo(Dados info, Arvore **raiz, Arvore *filho, char *nome, Dados*sobe);
void insereArvore23(Arvore **raiz, Arvore*pai, Dados info, Dados *sobe);



#endif