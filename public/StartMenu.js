export default class StartMenu extends Phaser.Scene
{
    constructor () {
        super('StartMenu');
    }

    create ()
    {
        // Background image
        this.add.image(400, 300, 'spacebackground1').setDisplaySize(800, 600);

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Welcome text
        this.welcomeText = this.add.text(centerX, centerY - 50, 'Welcome Ladies and Gentlemen', {
            font: '43px Dancing Script', // Font size and family
            fill: '#FFFFFF'    // Font color
        });
        // Center the origin of the text
        this.welcomeText.setOrigin(0.5, 2.5);

        // Intro text
        this.introText = this.add.text(centerX, centerY + 50, 'Click to Start', {
            font: '32px Dancing Script', // Font size and family
            fill: '#FFFFFF'    // Font color
        });
        // Center the origin of the text
        this.introText.setOrigin(0.5, -0.5);
        
        // Input interaction
        this.input.once('pointerdown', () => { 
            this.tweens.add({
                targets: this.introText,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    window.location.href = 'liveGraph/index.html';
                }
            });
        });
    }
}