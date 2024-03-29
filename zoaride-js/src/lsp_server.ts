// LSP サーバーの主要部分
// コンパイラが提供するソースコード解析 API をラップして LSP サーバーが提供すべき API 実装する。

import {
    Diagnostic,
    DiagnosticSeverity,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    InitializeParams,
    InitializeResult,
    InitializedParams,
    PublishDiagnosticsParams,
    TextDocumentSyncKind,
} from "vscode-languageserver-protocol"
import { parse } from "./zl_parse"

export interface LspServerSender {
    publishDiagnostics(params: PublishDiagnosticsParams): void
}

export class ZoarideLspServer implements ZoarideLspServer {
    private sender: LspServerSender
    private documents = new Map<string, string>()
    private exitCode = 1

    public constructor(sender: LspServerSender) {
        this.sender = sender
    }

    /**
     * ソースコードのエラーや警告を報告する。
     */
    private validateDocument(uri: string) {
        const text = this.documents.get(uri)
        if (text === undefined) {
            return
        }

        const parseResult = parse(text)

        const diagnostics: Diagnostic[] = []

        for (const message of parseResult.errors) {
            diagnostics.push({
                message,

                // 最初の1文字目
                range: {
                    start: {
                        line: 0,
                        character: 0,
                    },
                    end: {
                        line: 0,
                        character: 1,
                    },
                },

                severity: DiagnosticSeverity.Error,
                source: "zoaride lsp",
            })
        }

        this.sender.publishDiagnostics({ uri, diagnostics })
    }

    public initialize(_params: InitializeParams): InitializeResult {
        return {
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Full,
                },
            },
        }
    }

    public initialized(_params: InitializedParams): void {
        // サーバー開始時に何かする。
    }

    /**
     * LSP クライアントが終了しようとしているときに呼ばれる。
     *
     * まだ LSP サーバーのプロセスは停止させない。
     */
    public shutdown(): void {
        this.exitCode = 0

        // サーバー終了前に何かする。
    }

    /**
     * LSP サーバーを停止させる。
     */
    public exit(): void {
        process.exit(this.exitCode)
    }

    /**
     * LSP クライアントでファイルが開かれたとき
     */
    public textDocumentDidOpen(params: DidOpenTextDocumentParams): void {
        const uri = params.textDocument.uri
        const text = params.textDocument.text
        this.documents.set(uri, text)

        this.validateDocument(uri)
    }

    /**
     * LSP クライアントで開かれているファイルが変更されたとき
     */
    public textDocumentDidChange(params: DidChangeTextDocumentParams): void {
        const uri = params.textDocument.uri

        // SyncKind == Full なので全体が来る
        const text = params.contentChanges[0].text

        this.documents.set(uri, text)

        this.validateDocument(uri)
    }

    /**
     * LSP クライアントで開かれていたファイルが閉じられたとき
     */
    public textDocumentDidClose(params: DidCloseTextDocumentParams): void {
        const uri = params.textDocument.uri

        this.documents.delete(uri)
    }
}
