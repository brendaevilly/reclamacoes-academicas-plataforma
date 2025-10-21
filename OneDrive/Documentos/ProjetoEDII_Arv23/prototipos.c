#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "prototipos.h"


Arvore *criarNoArvore(Dados info, Arvore *esq, Arvore *meio){
    Arvore *noNovo = (Arvore*)malloc (sizeof(Arvore));
    if(noNovo){
        noNovo->info1 = info;
        noNovo->nInfo = 1;
        noNovo->esq =esq;
        noNovo->meio=meio;
        noNovo->dir= NULL; 
    }
    return noNovo;
}

int ehFolha(Arvore *raiz){
    int resultado;
    if(raiz->esq == NULL && raiz->dir==NULL && raiz->meio == NULL) resultado = 1;
    else resultado = 0;
    return resultado;
}
// se o nó tiver apenas uma info
int adicionaNo(Arvore **raiz, Arvore *no , char *nome ){
    int cmp,resultado; 
    cmp = strcmp(nome, (*raiz)->info1.Artista.nome);
    // se for maior, apenas adiciona a direita
    if(cmp > 0){
        strcpy((*raiz)->info2.Artista.nome,nome);
        (*raiz)->dir= no;
        (*raiz)->nInfo =2;
        resultado = 1;
    }else{
        strcpy((*raiz)->info2.Artista.nome , (*raiz)->info1.Artista.nome);
        strcpy((*raiz)->info1.Artista.nome, nome);
        (*raiz)->dir = (*raiz)->meio;
        (*raiz)->meio = no;
        (*raiz)->nInfo = 2;
        resultado = 0;
    }
    return resultado;
}

Arvore *quebrarNo(Dados info, Arvore **raiz, Arvore *filho, char *nome, Dados*sobe){
    Arvore *noMaior= NULL; 

    char *nome_info1 = (*raiz)->info1.Artista.nome;
    char *nome_info2 = (*raiz)->info2.Artista.nome;

    if(strcmp(nome,nome_info2)>0){
        *sobe = (*raiz)->info2;
        noMaior = criarNoArvore(info, (*raiz)->dir, filho);
       
    }else if(strcmp(nome,nome_info1)>0){
        *sobe = info; 
        noMaior = criarNoArvore((*raiz)->info2,filho,(*raiz)->dir );
    }else{
        *sobe = (*raiz)->info1;
        noMaior = criarNoArvore((*raiz)->info2,(*raiz)->meio, (*raiz)->dir);
        (*raiz)->info1 = info;
        (*raiz)->meio = filho;

    }
    (*raiz)->dir = NULL;
    (*raiz)->nInfo = 1;
       
    return noMaior;
}

void insereArvore23(Arvore **raiz, Arvore*pai, Dados info, Dados *sobe){

}


