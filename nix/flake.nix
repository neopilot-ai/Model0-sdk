{
  description = "Development shell for the model0 SDK monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachSystem
      [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ]
      (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          devShells.default = pkgs.mkShell {
            name = "model0-sdk";

            packages = with pkgs; [
              nodejs_22
              pnpm
              git
            ];

            shellHook = ''
              echo "model0 SDK dev shell: node $(node --version), pnpm $(pnpm --version)"
            '';
          };
        }
      );
}
