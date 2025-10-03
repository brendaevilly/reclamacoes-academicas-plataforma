#include <stdio.h>
#include <stdlib.h>
#include "prototipos.h"

criarNoArvore(Dados info, int flag, Cor cor){
    Arvore *novo = (Arvore*)malloc(sizeof(Arvore));
    if(novo){
        novo->info = info; 
        novo->flag = flag; 
        novo->cor = cor;
        novo->esq = novo->dir = NULL; 

        return novo; 
    }
}

void rotacaoEsquerda(Arvore **raiz){
    Arvore *aux ; 
    aux = (*raiz)->dir;
    (*raiz)->dir = aux->esq;
    aux->esq = (*raiz);
    aux->cor = (*raiz)->cor;
    (*raiz)->cor = VERMELHO;
    (*raiz) = aux;
}

void rotacaoDireita(Arvore **raiz){
    Arvore *aux ; 
    aux = (*raiz)->esq;
    (*raiz)->esq = aux->dir;
    aux->dir = (*raiz);
    aux->cor = (*raiz)->cor;
    (*raiz)->cor = VERMELHO;
    (*raiz) = aux;
}



