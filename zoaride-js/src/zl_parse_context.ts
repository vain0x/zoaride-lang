// 構文解析の状態管理

import * as assert from "assert"
import {
    GreenNode,
    GreenToken,
    NodeKind,
    ParseErrorKind,
    tokenIsTrivial,
} from "./zl_syntax"

/**
 * トークンリスト上の位置
 */
type TokenIndex = number

/**
 * 構文解析中の状態を管理するもの
 */
export class ParseContext {
    /**
     * 字句解析で構築したトークンリスト
     */
    private tokens: GreenToken[]

    /**
     * トークンリスト上の現在位置
     */
    private index: TokenIndex = 0

    public constructor(tokens: GreenToken[]) {
        assert.ok(tokens.length >= 1)
        assert.equal(tokens[tokens.length - 1].kind, "T_EOF")

        this.tokens = tokens
    }

    /**
     * 不変条件を表明する。
     */
    private assertInvariants() {
        assert.ok(0 <= this.index)
        assert.ok(this.index < this.tokens.length)
    }

    public currentIndex() {
        return this.index
    }

    public atEof() {
        return this.next() === "T_EOF"
    }

    /**
     * 次のトークンの種類
     */
    public next() {
        return this.tokens[this.index].kind
    }

    /**
     * 次の1トークン (trivial なものも含む) を読み飛ばす。
     */
    private doBump(node: GreenNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        const kind = this.next()

        node.children.push({
            kind: "L_TOKEN",
            token: this.tokens[this.index],
        })
        this.index++

        // 字句解析のエラーを構文解析が引き継ぐ。
        if (kind === "T_ERROR") {
            this.attachError(node, "PE_INVALID_CHAR")
        }
    }

    /**
     * trivial なトークンを読み飛ばす。
     */
    private bumpTrivial(node: GreenNode) {
        while (tokenIsTrivial(this.next())) {
            this.doBump(node)
        }
    }

    /**
     * 次のトークンを読み飛ばす。
     */
    public bump(node: GreenNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        this.doBump(node)
        this.bumpTrivial(node)

        this.assertInvariants()
    }

    /**
     * 指定された数のトークンを読み飛ばす。
     */
    public bumpMany(node: GreenNode, count: number) {
        assert.ok(count >= 0)
        assert.ok(this.index + count < this.tokens.length)

        for (let i = 0; i < count; i++) {
            this.bump(node)
        }
    }

    /**
     * 新しいノードを作る。
     */
    public startNode(): GreenNode {
        return {
            kind: "N_ROOT",
            children: [],
        }
    }

    /**
     * 他のノードの親になるノードを作る。
     *
     * 例えば `i + 1` をパースするとき、`i` のノードが完成した後に、
     * その親となる `+` のノードを作り始める。こういうときに使う。
     */
    public startBefore(childNode: GreenNode): GreenNode {
        return {
            kind: "N_ROOT",
            children: [
                {
                    kind: "L_NODE",
                    node: childNode,
                },
            ],
        }
    }

    /**
     * ルートノードを作る。
     */
    public startRoot(): GreenNode {
        assert.equal(this.index, 0)

        const node = this.startNode()
        this.bumpTrivial(node)

        return node
    }

    public endNode(node: GreenNode, nodeKind: NodeKind) {
        assert.equal(node.kind, "N_ROOT")
        node.kind = nodeKind
        return node
    }

    /**
     * 他のノードを子ノードとして追加する。
     */
    public attach(parentNode: GreenNode, childNode: GreenNode) {
        parentNode.children.push({
            kind: "L_NODE",
            node: childNode,
        })
    }

    /**
     * 構文エラーを子ノードとして追加する。
     */
    public attachError(node: GreenNode, errorKind: ParseErrorKind) {
        node.children.push({
            kind: "L_ERROR",
            errorKind,
        })
    }

    /**
     * 構文解析の終了時に呼ばれる。
     */
    public finish(root: GreenNode): GreenNode {
        assert.equal(this.index, this.tokens.length - 1)
        return root
    }
}
